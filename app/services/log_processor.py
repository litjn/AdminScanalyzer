# app/services/log_processor
from app.models.full_log import FullLogEntry
from app.utils.event_mapper import get_event_description

#Add the ML Classifier Import first

class LogProcessor:
    @staticmethod
    async def process(log_data: dict) -> dict:
        """
        Enrich the log without discarding existing data.
        """
        # Simulated enrichment process
        enriched_data = {
            "description": get_event_description(log_data["event_id"]),
            "ai_classification": "Normal",  # Example AI classification
            "alert": False,                # Example alert logic
            "trigger": False,              # Example trigger logic
        }

        # Return the merged log data
        return {**log_data, **enriched_data}