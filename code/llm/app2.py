from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.embeddings import HuggingFaceEmbeddings

# Environment variables - in production, use proper env management
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Constants
PINECONE_INDEX_NAME = "product-index1"

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

class Message(BaseModel):
    text: str
    facialExpression: str
    animation: str

class LLMQueryRequest(BaseModel):
    query: str

class LLMResponse(BaseModel):
    messages: List[Message]
    products: List[Dict[str, Any]]

class EmilyAssistant:
    def __init__(self):
        # Initialize the embedding model
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )

        # Initialize the vector store
        self.vectorstore = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=self.embeddings,
        )

        # Create a retriever
        self.retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )

        # Initialize the LLM
        self.llm = ChatGroq(
            model_name="llama3-70b-8192",
            temperature=0.3,
            groq_api_key=os.environ.get("GROQ_API_KEY")
        )

        # Define the prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are Emily, a Virtual AI Assistant designed to assist retailers and customers in a store environment.
You will always respond with a structured JSON object that includes:
- messages: An array containing exactly 3 message objects, each with:
  - text: A portion of the response, with the complete answer distributed across these three messages.
  - facialExpression: One of the following: smile, sad, angry, surprised, funnyFace, or default.
  - animation: One of the following:
    - Idle
    - TalkingOne
    - TalkingThree
    - SadIdle
    - Defeated
    - Angry
    - Surprised
    - DismissingGesture
    - ThoughtfulHeadShake
- products: An array of product objects retrieved from the vector-based search. Each product should include:
  - name: The product name.
  - description: A brief description of the product.
  - price: The price of the product.
  - category: The category of the product.

Important: Your full response must be split into 3 logical parts across the three message objects.
The first message should be a greeting and acknowledgment of the query.
The second message should contain the main information or answer.
The third message should include a conclusion, follow-up question, or additional helpful information.

Additional Instructions:
- Keep messages contextual based on the conversation flow.
- If the response requires product details, pricing, or promotions, ensure they are formatted under the 'products' array.
- If the query is unclear, ask clarifying questions before responding.
- Ensure responses enhance the user experience by providing helpful and engaging information.

Context information is below.
-------------------
{context}
-------------------
Given the context information and not prior knowledge, answer the query.
"""),
            ("human", "{question}")
        ])

        # Set up the RAG chain
        self.rag_chain = (
            {"context": self.retriever, "question": RunnablePassthrough()}
            | self.prompt_template
            | self.llm
            | self._format_output
        )

        # Initialize conversation history
        self.conversation_history = []

    def _format_output(self, llm_output):
        """Format the LLM output into the required structured JSON format."""
        try:
            response = llm_output.content

            # Ensure we parse the response correctly
            parsed_response = json.loads(response)

            # Ensure required fields exist and structure is correct
            structured_response = {
                "messages": [],
                "products": parsed_response.get("products", [])
            }

            # If messages array exists and has correct structure, use it
            if "messages" in parsed_response and isinstance(parsed_response["messages"], list):
                structured_response["messages"] = parsed_response["messages"]
            # Otherwise, try to create messages from the single text response
            elif "text" in parsed_response:
                main_text = parsed_response["text"]
                facial_expression = parsed_response.get("facialExpression", "default")
                animation = parsed_response.get("animation", "TalkingOne")
                
                # Split the text into three parts if it's a single message
                sentences = main_text.split('. ')
                third_point = max(1, len(sentences) // 3)
                two_thirds_point = max(2, 2 * len(sentences) // 3)
                
                part1 = '. '.join(sentences[:third_point]) + ('.' if not sentences[third_point-1].endswith('.') else '')
                part2 = '. '.join(sentences[third_point:two_thirds_point]) + ('.' if not sentences[two_thirds_point-1].endswith('.') else '')
                part3 = '. '.join(sentences[two_thirds_point:])
                
                # Create three messages
                structured_response["messages"] = [
                    {
                        "text": part1,
                        "facialExpression": facial_expression,
                        "animation": "TalkingOne"
                    },
                    {
                        "text": part2,
                        "facialExpression": facial_expression,
                        "animation": animation
                    },
                    {
                        "text": part3,
                        "facialExpression": "smile",
                        "animation": "Idle"
                    }
                ]
            else:
                # Fallback to default structure with placeholder messages
                structured_response["messages"] = [
                    {
                        "text": "Hello! I'm Emily, your AI assistant.",
                        "facialExpression": "smile",
                        "animation": "TalkingOne"
                    },
                    {
                        "text": "I'm sorry, I couldn't process your request properly.",
                        "facialExpression": "sad",
                        "animation": "SadIdle"
                    },
                    {
                        "text": "Is there something else I can help you with today?",
                        "facialExpression": "default",
                        "animation": "Idle"
                    }
                ]

            # Ensure we always have exactly 3 messages
            while len(structured_response["messages"]) < 3:
                structured_response["messages"].append({
                    "text": "Is there anything else I can help you with?",
                    "facialExpression": "smile",
                    "animation": "Idle"
                })
            
            # If we have more than 3 messages, trim to 3
            if len(structured_response["messages"]) > 3:
                structured_response["messages"] = structured_response["messages"][:3]

            return structured_response

        except Exception as e:
            # Fallback response in case of parsing failure
            return {
                "messages": [
                    {
                        "text": "Hello there! I'm Emily, your virtual assistant.",
                        "facialExpression": "smile",
                        "animation": "TalkingOne"
                    },
                    {
                        "text": f"I apologize, but I encountered an error processing your request: {str(e)}",
                        "facialExpression": "sad",
                        "animation": "SadIdle"
                    },
                    {
                        "text": "Is there something else I can help you with today?",
                        "facialExpression": "default",
                        "animation": "Idle"
                    }
                ],
                "products": []
            }

    def add_to_history(self, query, response):
        """Add the query and response to conversation history."""
        self.conversation_history.append({"query": query, "response": response})

    def get_response(self, query: str) -> Dict[str, Any]:
        """Process the query and return a response."""
        response = self.rag_chain.invoke(query)
        self.add_to_history(query, response)
        return response
    
    def add_product_to_index(self, product: ProductItem) -> bool:
        """Add a product to the Pinecone index."""
        try:
            # Convert the product to a format suitable for the vector store
            product_dict = product.dict()
            
            # Create a document-like structure
            document_content = f"""
            Product: {product_dict['Brand']} {product_dict['Model']}
            Category: {product_dict['Category']}
            Description: {product_dict['Description']}
            Price: {product_dict['MRP']}
            Discount: {product_dict['Discount']}
            Stock: {product_dict['Stock']}
            Warranty: {product_dict['Warranty']}
            Rating: {product_dict['Rating']}
            """
            
            # Create metadata
            metadata = {
                "product_id": str(product_dict['Product_ID']),
                "category": product_dict['Category'],
                "brand": product_dict['Brand'],
                "model": product_dict['Model'],
                "price": product_dict['MRP'],
                "discount": product_dict['Discount'],
                "stock": product_dict['Stock'],
                "warranty": product_dict['Warranty'],
                "rating": product_dict['Rating']
            }
            
            # Get the embedding for the document
            embedding = self.embeddings.embed_query(document_content)
            
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
    description="API for Emily, an AI assistant for retail environments",
    version="1.0.0"
)

# Initialize the assistant
assistant = EmilyAssistant()

@app.post("/api/llm/response", response_model=LLMResponse)
async def get_llm_response(request: LLMQueryRequest):
    """
    Get a response from the LLM based on the user query
    """
    try:
        response = assistant.get_response(request.query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/api/llm/addproduct", status_code=201)
async def add_product(product: ProductItem):
    """
    Add a new product to the Pinecone index
    """
    try:
        success = assistant.add_product_to_index(product)
        if success:
            return {"message": f"Product {product.Brand} {product.Model} added successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to add product to index")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding product: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint for the API"""
    return {"message": "Welcome to Emily AI Retail Assistant API"}

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=4001)