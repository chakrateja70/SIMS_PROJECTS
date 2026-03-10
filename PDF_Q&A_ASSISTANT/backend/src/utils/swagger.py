from src.schemas.response import DocumentProcessSuccessResponse
from src.schemas.response import QuerySuccessResponse, QueryNotFoundResponse

uploadendpoint = {
	"summary": "Upload and process documents",
	"description": "Upload one or more files. The files will be processed, embedded, and stored in Pinecone. Returns processing metadata.",
	"response_model": DocumentProcessSuccessResponse,
	"responses": {
		200: {
			"description": "Documents processed and stored successfully",
			"content": {
				"application/json": {
					"example": {
                        "statusCode": 200,
						"success": True,
						"message": "Documents processed and stored successfully",
						"documents_processed": 2,
						"vectors_stored": 10
					}
				}
			}
		},
		500: {
			"description": "Error during document processing",
			"content": {
				"application/json": {
					"example": {
						"statusCode": 500,
						"statusMessage": "Internal Server Error",
						"errorMessage": "Failed to process documents."
					}
				}
			}
		}
	}
}


queryendpoint = {
    "summary": "Ask a question to the RAG chatbot",
    "description": "Submit a query to get an answer based on the processed documents. You can optionally filter the search to a specific filename.",
    "response_model": QuerySuccessResponse,
    "openapi_extra": {
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {
                        "query": "What services does Lomaa IT Solutions provide?",
                        "top_k": 3, # Optional, default is 5
                        "min_score": 0.5 # Optional, default is 0.5
                    }
                }
            }
        }
    },
    "responses": {
        200: {
            "description": "Successfully retrieved an answer",
            "content": {
                "application/json": {
                    "example": {
                        "statusCode": 200,
                        "success": True,
                        "message": "Answer retrieved successfully",
                        "query": "what is rag?",
                        "answer": "RAG stands for Retrieval-Augmented Generation, a technique that combines retrieval of relevant documents with generative models to provide accurate and context-aware answers."
                    }
                }
            }
        },
        404: {
            "description": "No relevant information found to answer the query",
            "content": {
                "application/json": {
                    "example": {
                        "statusCode": 404,
                        "success": False,
                        "message": "Information not found",
                        "query": "What is the company's policy on space travel?",
                        "answer": "I could not find any relevant information to answer that question in the provided documents."
                    }
                }
            }
        },
        500: {
            "description": "Error during query processing",
            "content": {
                "application/json": {
                    "example": {
                        "statusCode": 500,
                        "statusMessage": "Internal Server Error",
                        "errorMessage": "Failed to process the query."
                    }
                }
            }
        },
        422: {
            "description": "Validation error (Unprocessable Entity)",
            "content": {
                "application/json": {
                    "example": {
                        "detail": [
                            {
                                "loc": ["body", "query"],
                                "msg": "Field required",
                                "type": "value_error.missing"
                            }
                        ]
                    }
                }
            }
        }
    }
}

