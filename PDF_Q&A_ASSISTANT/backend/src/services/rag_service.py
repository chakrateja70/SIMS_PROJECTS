from src.schemas.response import QueryNotFoundResponse, QuerySuccessResponse
from src.utils.document_processor import RagPipeline
from src.services.llm_service import llm_service
from src.core.constants import FALLBACK_MESSAGE

try:
    rag_pipeline = RagPipeline()
except Exception as e:
    raise RuntimeError(f"Failed to initialize RagPipeline: {e}")

def get_rag_response(query: str, top_k: int = 5, min_score: float = 0.8):
    """
    Orchestrates the RAG process to get a final answer from the LLM.

    """
    try:
        # 1. Retrieve relevant document chunks and highest scored vector website
        docs, highest_url = rag_pipeline.retrieve_relevant_chunks(
            query=query,
            top_k=top_k,
            min_score=min_score,
        )

        # 2. Handle the case where no relevant information is found
        if not docs:
            print(f"Answer: {FALLBACK_MESSAGE}")
            return QueryNotFoundResponse(
                statusCode=404,
                success=False,
                message="Information not found",
                query=query,
                answer=FALLBACK_MESSAGE
            )

        # 3. Prepare the context for the LLM from retrieved documents
        # Format each document with metadata to help the LLM understand the source and relevance
        formatted_docs = []
        for doc in docs:
            title = doc.metadata.get('title') or doc.metadata.get('filename') or 'Untitled'
            section = doc.metadata.get('section')
            category = doc.metadata.get('category') or 'General'
            score = doc.metadata.get('score', 0)

            header = f"Document: {title}"
            if section:
                header += f", Section: {section}"

            formatted_doc = (
                f"{header}\n"
                f"Category: {category}\n"
                f"Relevance Score: {score:.2f}\n"
                f"Content:\n{doc.page_content}"
            )
            formatted_docs.append(formatted_doc)
            
        context = "\n\n" + "\n\n---\n\n".join(formatted_docs)

        # 4. Generate the final answer using the LLM
        final_answer = llm_service.generate_answer(context=context, question=query)
        print(f"Answer: {final_answer}")

        # Deduplicate source filenames (case-insensitive)
        seen = {}
        for doc in docs:
            name = doc.metadata.get('filename', '')
            if name and name.lower() not in seen:
                seen[name.lower()] = name
        unique_sources = list(seen.values())

        # Create response object
        response = QuerySuccessResponse(
            statusCode=200,
            success=True,
            message="Answer retrieved successfully",
            query=query,
            answer=final_answer,
            sources=unique_sources,
        )
        
        # If the answer is the fallback message, don't include a source URL.
        if final_answer.strip() == FALLBACK_MESSAGE.strip():
            return response

        # Handle source URL with improved validation
        is_valid_url = (
            highest_url and 
            highest_url != "NA" and 
            isinstance(highest_url, str) and 
            (highest_url.startswith("http://") or highest_url.startswith("https://"))
        )
        
        if is_valid_url:
            response.answer = f"{response.answer}\nSource: {highest_url}"
        
        # Always return the response object
        return response

    except Exception as e:
        # Log the error for debugging
        print(f"Error in RAG pipeline for query '{query}': {str(e)}")
        
        return QueryNotFoundResponse(
            statusCode=500,
            success=False,
            message=f"Error processing PDF documents: {str(e)}",
            query=query,
            answer="An error occurred while searching through the PDF documents. Please try again or rephrase your query."
        )