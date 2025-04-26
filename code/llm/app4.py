from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pinecone import Pinecone
import os
import uuid
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="Store Module API", description="API for managing products in the AI Enhanced 3D Shopping system")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pinecone with new method
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME", "product-store")
index = pc.Index(index_name)

# Data models
class ProductBase(BaseModel):
    brand: str
    category: str
    description: str
    MRP: float
    stock: int
    warranty: str

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    MRP: Optional[float] = None
    stock: Optional[int] = None
    warranty: Optional[str] = None

class Product(ProductBase):
    id: str
    created_at: str
    updated_at: str

class ProductResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[Any] = None

# Helper function
def format_product_for_pinecone(product_data, product_id=None):
    # Generate ID if not provided
    if not product_id:
        product_id = str(uuid.uuid4())
    
    # Current timestamp
    now = datetime.now().isoformat()
    
    # Create metadata
    metadata = {
        "brand": product_data.get("brand", ""),
        "category": product_data.get("category", ""),
        "description": product_data.get("description", ""),
        "MRP": float(product_data.get("MRP", 0)),
        "stock": int(product_data.get("stock", 0)),
        "warranty": product_data.get("warranty", ""),
        "created_at": product_data.get("created_at", now),
        "updated_at": now
    }
    
    # Simple vector (replace with actual embeddings in production)
    vector = [0.0] * 384  # Adjust dimension as needed
    
    return product_id, vector, metadata

# API Routes
@app.post("/products/", response_model=ProductResponse)
async def create_product(product: ProductCreate):
    try:
        product_dict = product.dict()
        product_id, vector, metadata = format_product_for_pinecone(product_dict)
        
        # Upsert to Pinecone
        index.upsert(vectors=[(product_id, vector, metadata)])
        
        return {
            "status": "success",
            "message": "Product added successfully",
            "data": {"product_id": product_id}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    try:
        response = index.fetch(ids=[product_id])
        
        # Check if product exists in the new response format
        if not response.vectors or product_id not in response.vectors:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Access data using the new response format
        vector_data = response.vectors[product_id]
        product_data = vector_data.metadata
        product_data["id"] = product_id
        
        return {
            "status": "success",
            "data": {"product": product_data}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductUpdate):
    try:
        # Check if product exists
        response = index.fetch(ids=[product_id])
        
        # Check if product exists in the new response format
        if not response.vectors or product_id not in response.vectors:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get current data using the new response format
        current_data = response.vectors[product_id].metadata
        
        # Update with new data (only non-None fields)
        update_data = {k: v for k, v in product.dict().items() if v is not None}
        merged_data = {**current_data, **update_data}
        
        # Format and upsert
        _, vector, metadata = format_product_for_pinecone(merged_data, product_id)
        index.upsert(vectors=[(product_id, vector, metadata)])
        
        return {
            "status": "success",
            "message": "Product updated successfully",
            "data": {"product_id": product_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/products/{product_id}", response_model=ProductResponse)
async def delete_product(product_id: str):
    try:
        # Check if product exists
        response = index.fetch(ids=[product_id])
        
        # Check if product exists in the new response format
        if not response.vectors or product_id not in response.vectors:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Delete from Pinecone
        index.delete(ids=[product_id])
        
        return {
            "status": "success",
            "message": "Product deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories/", response_model=ProductResponse)
async def get_categories():
    try:
        # Simple approach to get unique categories
        query_vector = [0.0] * 384
        results = index.query(
            vector=query_vector,
            top_k=1000,
            include_metadata=True
        )
        
        categories = set()
        for match in results.matches:
            category = match.metadata.get("category") if hasattr(match, "metadata") else None
            if category:
                categories.add(category)
        
        return {
            "status": "success",
            "data": {"categories": list(categories)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brands/", response_model=ProductResponse)
async def get_brands():
    try:
        # Get unique brands
        query_vector = [0.0] * 384
        results = index.query(
            vector=query_vector,
            top_k=1000,
            include_metadata=True
        )
        
        brands = set()
        for match in results.matches:
            brand = match.metadata.get("brand") if hasattr(match, "metadata") else None
            if brand:
                brands.add(brand)
        
        return {
            "status": "success",
            "data": {"brands": list(brands)}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)