import traceback
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import random
import time
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.runnables import RunnableLambda
# from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from functools import lru_cache

# Environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

# Add new model for chat history
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class LLMQueryRequest(BaseModel):
    query: str
    history: Optional[List[ChatMessage]] = []
    language: str = "english"  # Default to english

# Pydantic models for API
class ProductItem(BaseModel):
    Product_ID: int
    Category: str
    Brand: str
    Model: str
    Description: str
    MRP: float
    Discount: str
    Stock: int
    Warranty: str
    Rating: float
    Image_URL: Optional[str] = None

class Message(BaseModel):
    text: str
    facialExpression: str
    animation: str

class LLMResponse(BaseModel):
    messages: List[Message]
    products: List[Dict[str, Any]]
    
class ProductResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Any] = None

# Pre-initialize embedding model at module level to ensure it's loaded once
print("Pre-loading HuggingFace embedding model...")
start_time = time.time()
EMBEDDING_MODEL = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)
print(f"Embedding model loaded in {time.time() - start_time:.2f} seconds")

class EmilyAssistant:
    def __init__(self):
        # Use pre-loaded embedding model
        self.embeddings = EMBEDDING_MODEL
        
        print("Initializing Pinecone connection...")
        start_time = time.time()
        # Initialize the vector store
        self.vectorstore = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=self.embeddings,
        )
        print(f"Pinecone connection initialized in {time.time() - start_time:.2f} seconds")

        # Retriever with reduced k for faster retrieval
        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        print("Initializing LLM connection...")
        start_time = time.time()
        # Initialize the LLM with more efficient settings
        self.llm = ChatGroq(
            model_name="llama3-70b-8192",
            temperature=0.2,  # Lower temperature for faster, more deterministic responses
            groq_api_key=os.environ.get("GROQ_API_KEY"),
            max_tokens=1024  # Limit output tokens for faster responses
        )
        print(f"LLM connection initialized in {time.time() - start_time:.2f} seconds")

        # Prompt template
        # Update the prompt template in __init__ method
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are Emily, a retail AI Assistant. Always respond with a JSON object that includes:
        - messages: An array with exactly 3 message objects, each containing:
        - text: Part of the response (split across 3 messages)
        - facialExpression: One of: smile, sad, angry, surprised, funnyFace, default
        - animation: One of: Talking, Dwarf Idle, Disappointed, Annoyed Head Shake, Acknowledging, Holding Idle, Head Nod Yes, Hard Head Nod, Happy Idle, Searching Pockets, Sarcastic Head Nod, Sad Idle, Neck Stretching, Look Around, Thoughtful Head Shake, Thoughtful Head Nod, Shaking Head No, Waving, Standing Idle
        - products: Array of relevant products from context

        IMPORTANT: You MUST respond in {language} language only for all text messages.
        IMPORTANT: Provide a natural conversation that DOESN'T always start with "Hi there" or generic greetings. Vary your responses based on the query context. Only use greeting phrases in your first message when appropriate for the query.

        IMPORTANT: Each product in the products array MUST include these fields:
        - name: full product name (Brand + Model)
        - description: A detailed description of the product
        - mrp: mrp price
        - discount: discount percentage
        - price: The final price (from Actual Price field)
        - stock: no of stocks
        - warrenty: warrenty years
        - category: The product category
        - img: The product image URL

        Message structure:
        1. First message: Context-appropriate opening (not always a greeting)
        2. Second message: Main information/answer
        3. Third message: Conclusion with follow-up question asked

        Context:
        {context}

        Chat History:
        {history}

        Answer directly based on context provided and maintain conversation continuity with the chat history."""),
            ("human", "{question}")
        ])

        # RAG chain
        print("Setting up RAG chain...")
        self.rag_chain = (
        {
            "context": RunnableLambda(lambda x: self.retriever.invoke(x["question"])),
            "question": RunnablePassthrough(),
            "history": RunnablePassthrough(),
            "language": RunnablePassthrough()
        }
        | self.prompt_template
        | self.llm
        | self._format_output
        )
        print(f"RAG chain setup completed in {time.time() - start_time:.2f} seconds")
        
        # Pre-warm the chain with a dummy query
        print("Pre-warming the chain with a dummy query...")
        start_time = time.time()
        try:
            _ = self.rag_chain.invoke("show me a product")
            print(f"Chain pre-warmed in {time.time() - start_time:.2f} seconds")
        except Exception as e:
            print(f"Pre-warming failed, but continuing: {str(e)}")
        
        # List of varied opening phrases to avoid repetitive greetings
        self.opening_phrases = [
            "Based on what you're looking for,",
            "Looking at our inventory,",
            "According to our product database,",
            "I found some options that match your needs.",
            "Let me show you what we have available.",
            "Here's what I found for you.",
            "We have several products that might interest you.",
            "I've found some great matches for your request.",
            "Our store carries several options for that.",
            "Let me pull up that information for you."
        ]
        print("EmilyAssistant initialization complete!")

    @lru_cache(maxsize=128)
    def _get_cached_response(self, query_key: str):
        """Cache responses for common queries"""
        return self.rag_chain.invoke(query_key)
    
    def _format_chat_history(self, history):
        """Format chat history into a string for the prompt."""
        if not history:
            return ""
        
        formatted_history = []
        
        try:
            for msg in history:
                # Handle different message formats
                if isinstance(msg, dict):
                    role = msg.get('role', '')
                    content = msg.get('content', '')
                elif hasattr(msg, 'role') and hasattr(msg, 'content'):
                    # Pydantic model or similar object
                    role = msg.role
                    content = msg.content
                else:
                    # Try to convert to string as fallback
                    try:
                        content = str(msg)
                        role = "unknown"
                    except:
                        continue
                
                # Format the message
                user_role = "Customer" if role.lower() == "user" else "Emily"
                formatted_history.append(f"{user_role}: {content}")
        except Exception as e:
            print(f"Error formatting history: {str(e)}")
            traceback.print_exc()  # Print full stack trace
            return ""  # Return empty string on error
        
        return "\n".join(formatted_history)
    
    def _format_output(self, llm_output):
        """Format the LLM output into the required structured JSON format with complete product information."""
        try:
            response = llm_output.content

            # Basic output structure
            structured_response = {
                "messages": [],
                "products": []
            }

            # Fast path for properly formatted JSON
            try:
                parsed_response = json.loads(response)
                
                # Process products and ensure all required fields exist
                if "products" in parsed_response and isinstance(parsed_response["products"], list):
                    products = parsed_response.get("products", [])
                    formatted_products = []
                    
                    for product in products:
                        # Ensure all required fields are present
                        formatted_product = {
                            "name": product.get("name", f"{product.get('brand', '')} {product.get('model', '')}").strip(),
                            "description": product.get("description", "Product description not available"),
                            "price": product.get("price", product.get("MRP", "Price not available")),
                            "category": product.get("category", product.get("Category", "Uncategorized")),
                            "img": product.get("img", product.get("image", "/default-product.jpg"))
                        }
                        
                        # Copy any additional fields that might be useful
                        for key, value in product.items():
                            if key not in formatted_product and key not in ["name", "description", "price", "category", "img"]:
                                formatted_product[key] = value
                        
                        formatted_products.append(formatted_product)
                    
                    structured_response["products"] = formatted_products
                
                # Process messages
                if "messages" in parsed_response and isinstance(parsed_response["messages"], list):
                    messages = parsed_response["messages"][:3]
                    
                    # Check if first message starts with a generic greeting and replace if needed
                    if len(messages) > 0 and any(messages[0]["text"].lower().startswith(greeting) for greeting in 
                                                ["hi there", "hello", "hi ", "greetings", "hey there"]):
                        messages[0]["text"] = random.choice(self.opening_phrases) + messages[0]["text"].split(",", 1)[1] if "," in messages[0]["text"] else messages[0]["text"]
                    
                    # Ensure we have exactly 3 messages
                    while len(messages) < 3:
                        messages.append({
                            "text": "Is there anything specific about these products you'd like to know?",
                            "facialExpression": "smile",
                            "animation": "Standing Idle"
                        })
                    
                    structured_response["messages"] = messages
                    return structured_response
                
            except json.JSONDecodeError:
                # If not valid JSON, fall through to text processing
                pass
            
            # Fallback text processing - simplified
            main_text = response
            
            # Create three equal chunks
            sentences = main_text.split('. ')
            length = len(sentences)
            
            part1 = '. '.join(sentences[:max(1, length // 3)]) + '.'
            part2 = '. '.join(sentences[max(1, length // 3):max(2, 2 * length // 3)]) + '.'
            part3 = '. '.join(sentences[max(2, 2 * length // 3):])
            
            # Add periods if they're missing
            for part in [part1, part2, part3]:
                if not part.endswith(('.', '!', '?')):
                    part += '.'
            
            # Use varied opening phrase instead of generic greeting
            part1 = random.choice(self.opening_phrases) + " " + part1
            
            structured_response["messages"] = [
                {"text": part1, "facialExpression": "smile", "animation": "TalkingOne"},
                {"text": part2, "facialExpression": "default", "animation": "TalkingThree"},
                {"text": part3, "facialExpression": "smile", "animation": "Standing Idle"}
            ]
            
            return structured_response

        except Exception as e:
            # Minimal fallback response with varied opening
            return {
                "messages": [
                    {"text": random.choice(self.opening_phrases) + " I'm Emily, your AI shopping assistant.", "facialExpression": "smile", "animation": "TalkingOne"},
                    {"text": "I'm sorry, I couldn't process your request properly right now.", "facialExpression": "sad", "animation": "SadIdle"},
                    {"text": "Could you try rephrasing your question, or ask about a specific product category?", "facialExpression": "default", "animation": "Idle"}
                ],
                "products": []
            }

    def get_response(self, query: str, history: List[ChatMessage] = None, language: str = "english") -> Dict[str, Any]:
        """Process the query with chat history and return a response"""
        try:
            # Ensure query is a string
            if not isinstance(query, str):
                if isinstance(query, dict) and 'query' in query:
                    query = query['query']
                    language = query.get('language', 'english')
                elif isinstance(query, dict) and 'question' in query:
                    query = query['question']
                    language = query.get('language', 'english')
                else:
                    query = str(query)
            
            # Process and format history safely
            formatted_history = ""
            if history:
                try:
                    formatted_history = self._format_chat_history(history)
                except Exception as e:
                    print(f"Error formatting history: {str(e)}")
                    traceback.print_exc()
                    formatted_history = ""
            
            print(f"Query: {query}")
            print(f"Formatted history: {formatted_history}")
            print(f"Language: {language}")
            
            # Make sure we're passing strings to the RAG chain
            response = self.rag_chain.invoke({
                "question": query,
                "history": formatted_history,
                "language": language
            })
            return response
        except Exception as e:
            print(f"Error in get_response: {str(e)}")
            traceback.print_exc()
            return {
                "messages": [
                    {"text": "I'm sorry, I encountered an error processing your request.", "facialExpression": "sad", "animation": "Standing Idle"},
                    {"text": "Could you try asking your question in a different way?", "facialExpression": "default", "animation": "Standing Idle"},
                    {"text": "I'm here to help with product information and shopping assistance.", "facialExpression": "smile", "animation": "Talking"}
                ],
                "products": []
            }
        
        
    def add_product_to_index(self, product: ProductItem) -> bool:
        """Add a product to the Pinecone index."""
        try:
            # Convert the product to a format suitable for the vector store
            product_dict = product.dict()
            
            # Create a more concise document representation
            document_content = f"""Product: {product_dict['Brand']} {product_dict['Model']}
Category: {product_dict['Category']}
Description: {product_dict['Description']}
Price: {product_dict['MRP']}
Discount: {product_dict['Discount']}"""
            
            # Create metadata - including all required fields for product display
            metadata = {
                "product_id": str(product_dict['Product_ID']),
                "category": product_dict['Category'],
                "brand": product_dict['Brand'],
                "model": product_dict['Model'],
                "name": f"{product_dict['Brand']} {product_dict['Model']}",
                "price": product_dict['MRP'],
                "description": product_dict['Description'],
                "discount": product_dict['Discount'],
                "img": product_dict.get('Image_URL', f"/products/{product_dict['Product_ID']}.jpg")
            }
            
            # Add to Pinecone
            self.vectorstore.add_texts(
                texts=[document_content],
                metadatas=[metadata],
                ids=[f"product_{product_dict['Product_ID']}"]
            )
            
            return True
        except Exception as e:
            print(f"Error adding product to index: {str(e)}")
            return False

# Initialize FastAPI app
app = FastAPI(
    title="Emily AI Retail Assistant API",
    on_startup=[lambda: print("FastAPI server starting...")]
)

# Pre-initialize the assistant at module level (will be created when first imported)
print("Pre-initializing EmilyAssistant singleton...")
EMILY_ASSISTANT = EmilyAssistant()
print("EmilyAssistant singleton created and ready!")

# Simple function to get the pre-initialized assistant
def get_assistant():
    return EMILY_ASSISTANT

# class LLMQueryRequest(BaseModel):
#     query: str
#     history: Optional[List[Dict[str, str]]] = None  # Simplified - accept a list of dicts

@app.post("/api/llm/response", response_model=LLMResponse)
async def get_llm_response(request: LLMQueryRequest):
    """Get a response from the LLM based on the user query and chat history"""
    try:
        assistant = get_assistant()
        
        # Extract the query string and language
        query = request.query
        language = request.language.lower()  # Normalize to lowercase
        
        # Extract history if present
        history = getattr(request, 'history', None)
        
        # Debug information
        print(f"Processing query: '{query}', Language: {language}, History present: {history is not None}")
        if history:
            print(f"History type: {type(history)}, length: {len(history)}")
        
        # Generate a response with proper error handling
        try:
            response = assistant.get_response(query, history, language)
        except Exception as e:
            print(f"Error in assistant.get_response: {str(e)}")
            traceback.print_exc()
            # Fallback response
            response = {
                "messages": [
                    {"text": "I'm sorry, I encountered an error processing your request.", "facialExpression": "sad", "animation": "Sad Idle"},
                    {"text": "Our systems are experiencing some issues right now.", "facialExpression": "default", "animation": "Idle"},
                    {"text": "Please try again in a moment.", "facialExpression": "smile", "animation": "Talking"}
                ],
                "products": []
            }
        
        return response
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
   
@app.post("/api/llm/addproduct", status_code=201)
async def add_product(product: ProductItem):
    """Add a new product to the Pinecone index"""
    try:
        assistant = get_assistant()
        success = assistant.add_product_to_index(product)
        if success:
            return {"message": f"Product {product.Brand} {product.Model} added successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add product")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Get all products from pinecone
@app.get("/products/", response_model=ProductResponse)
async def get_products(
    brand: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    try:
        # Build filter
        filter_dict = {}
        if brand:
            filter_dict["brand"] = {"$eq": brand}
        if category:
            filter_dict["category"] = {"$eq": category}
        if min_price is not None:
            filter_dict["MRP"] = {"$gte": min_price}
        if max_price is not None:
            if "MRP" in filter_dict:
                filter_dict["MRP"]["$lte"] = max_price
            else:
                filter_dict["MRP"] = {"$lte": max_price}
        
        # Query Pinecone
        query_vector = [0.0] * 384  # Dummy vector for metadata search
        results = index.query(
            vector=query_vector,
            filter=filter_dict if filter_dict else None,
            top_k=100,
            include_metadata=True
        )
        
        # Format results
        products = []
        for match in results.matches:
            product = match.metadata if hasattr(match, "metadata") else {}
            product["id"] = match.id
            products.append(product)
        
        return {
            "status": "success",
            "data": {"products": products, "count": len(products)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint"""
    return {"status": 200,"message": "LLM API is working..."}

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    print(f"Unhandled exception: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run(app, port=4001)