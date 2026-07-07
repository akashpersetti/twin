import os
import sys
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from retrieval import Chunk, slugify, chunk_profile_text, PROFILE_PATH, cosine_similarity, embed_text


class TestSlugify:
    """Test the slugify function."""

    def test_slugify_basic(self):
        """Test basic slugification."""
        assert slugify("Identity and Contact") == "identity-and-contact"

    def test_slugify_multiple_spaces(self):
        """Test that multiple spaces collapse to single dash."""
        assert slugify("Professional  Summary") == "professional-summary"

    def test_slugify_special_chars(self):
        """Test that special characters are replaced with dashes."""
        assert slugify("Current Role: AI Engineer") == "current-role-ai-engineer"

    def test_slugify_strip_dashes(self):
        """Test that leading/trailing dashes are stripped."""
        assert slugify("---test---") == "test"


class TestChunk:
    """Test the Chunk dataclass."""

    def test_chunk_creation(self):
        """Test creating a Chunk with required fields."""
        chunk = Chunk(
            chunk_id="test-chunk",
            section_title="Test Section",
            text="Test text content"
        )
        assert chunk.chunk_id == "test-chunk"
        assert chunk.section_title == "Test Section"
        assert chunk.text == "Test text content"
        assert chunk.embedding is None

    def test_chunk_with_embedding(self):
        """Test creating a Chunk with embedding."""
        embedding = [0.1, 0.2, 0.3]
        chunk = Chunk(
            chunk_id="test-chunk",
            section_title="Test Section",
            text="Test text content",
            embedding=embedding
        )
        assert chunk.embedding == embedding


class TestChunkProfileText:
    """Test the chunk_profile_text function."""

    def test_chunk_profile_text_produces_expected_chunk_ids(self):
        """Test that chunking produces exactly 16 chunks with correct IDs in order."""
        with open(PROFILE_PATH, 'r') as f:
            text = f.read()

        chunks = chunk_profile_text(text)
        chunk_ids = [chunk.chunk_id for chunk in chunks]

        expected_ids = [
            "identity-and-contact",
            "professional-summary",
            "technical-identity-and-working-style",
            "current-role-ai-engineer-at-myedmaster-llc",
            "previous-role-machine-learning-intern-at-myedmaster-llc",
            "previous-role-web-development-intern-at-squadcast-labs",
            "project-wingman-self-evaluating-agentic-co-worker",
            "project-twin-streaming-ai-digital-twin",
            "project-tallymark-voice-text-agentic-expense-splitter",
            "project-mcp-second-opinion-open-source-mcp-server",
            "laxora-ai-founding-software-engineer",
            "education",
            "technical-skills",
            "certifications",
            "job-search-and-career-direction",
            "personal-interests",
        ]

        assert len(chunks) == 16, f"Expected 16 chunks, got {len(chunks)}"
        assert chunk_ids == expected_ids, f"Chunk IDs don't match.\nGot: {chunk_ids}\nExpected: {expected_ids}"

    def test_chunk_profile_text_chunks_have_nonempty_text(self):
        """Test that every chunk has non-empty text."""
        with open(PROFILE_PATH, 'r') as f:
            text = f.read()

        chunks = chunk_profile_text(text)

        for chunk in chunks:
            assert chunk.text.strip(), f"Chunk {chunk.chunk_id} has empty text"
            assert len(chunk.text.strip()) > 0

    def test_current_role_chunk_has_correct_database(self):
        """Test that the current-role chunk contains both PostgreSQL and pgvector."""
        with open(PROFILE_PATH, 'r') as f:
            text = f.read()

        chunks = chunk_profile_text(text)
        current_role_chunk = next(
            (c for c in chunks if c.chunk_id == "current-role-ai-engineer-at-myedmaster-llc"),
            None
        )

        assert current_role_chunk is not None, "current-role chunk not found"
        assert "PostgreSQL" in current_role_chunk.text, "PostgreSQL not found in current-role chunk"
        assert "pgvector" in current_role_chunk.text, "pgvector not found in current-role chunk"


class TestCosineSimilarity:
    """Test the cosine_similarity function."""

    def test_cosine_similarity_identical_vectors_is_one(self):
        """Test that identical vectors have cosine similarity of 1.0."""
        a = [1.0, 2.0, 3.0]
        b = [1.0, 2.0, 3.0]
        assert cosine_similarity(a, b) == 1.0

    def test_cosine_similarity_orthogonal_vectors_is_zero(self):
        """Test that orthogonal vectors have cosine similarity of 0.0."""
        a = [1, 0]
        b = [0, 1]
        assert cosine_similarity(a, b) == 0.0

    def test_cosine_similarity_zero_vector_returns_zero(self):
        """Test that zero vector returns 0.0."""
        a = [0.0, 0.0, 0.0]
        b = [1.0, 2.0, 3.0]
        assert cosine_similarity(a, b) == 0.0
        assert cosine_similarity(b, a) == 0.0

    @patch('retrieval.get_bedrock_client')
    def test_embed_text_calls_bedrock_and_parses_embedding(self, mock_get_client):
        """Test that embed_text calls Bedrock and parses the embedding correctly."""
        # Mock the Bedrock response
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client

        # Mock the response body
        mock_response = {
            "body": MagicMock()
        }
        mock_response["body"].read.return_value = b'{"embedding": [0.1, 0.2, 0.3, 0.4]}'
        mock_client.invoke_model.return_value = mock_response

        # Call embed_text
        result = embed_text("test text")

        # Verify the result
        assert result == [0.1, 0.2, 0.3, 0.4]

        # Verify that invoke_model was called with correct parameters
        mock_client.invoke_model.assert_called_once()
        call_args = mock_client.invoke_model.call_args
        assert call_args.kwargs['modelId'] == "amazon.titan-embed-text-v2:0"
        assert call_args.kwargs['body'] == '{"inputText": "test text"}'
