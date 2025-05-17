
"""

Cut out code from log_model.py, when you want to test the validation just take
it back to the class and run the code............

# Example usage: Validating log data
if __name__ == "__main__":
    incoming_data = {
        "_id": "agent123:Application:1",
        "agent_id": "agent123",
        "record_id": 1,
        "timestamp": "2023-10-26T12:34:56Z",
        "channel": "Application",
        "event_id": 4624,
        "provider": "Security",
        "event_host": "localhost",
        "user_sid": "S-1-5-21-3623811015-3361044348-30300820-1013",
        "level": "Info",
        "level_code": 4,
        "message": ["Logon success", "Interactive process"],
        "win_event_data": {
            "task_category": "Logon",
            "keywords": ["Audit Success"],
            "opcode": 0,
            "process_id": 1337,
            "logon_type": "Interactive",
            "source_ip": "192.168.1.1"
        }
    }

    try:
        log_entry = LogEntry(**incoming_data)
        # Serialize and pretty-print the validated object
        json_string = log_entry.model_dump_json()  # Get raw JSON string
        pretty_json = json.dumps(json.loads(json_string), indent=4)  # Pretty-print
        print(pretty_json)

    except ValidationError as e:
        print("Validation Error:", e.json(indent=4))



"""