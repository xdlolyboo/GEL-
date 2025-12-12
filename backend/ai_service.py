import google.generativeai as genai
import json
import os
import sys

class ScheduleParser:
    """
    Service class to handle AI-powered schedule parsing using Google Gemini.
    """
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def parse_schedule_image(self, image_path):
        """
        Analyzes a schedule image and returns a list of schedule items.
        Uses a structured prompt to ensure Gemini returns valid JSON.
        """
        prompt = """
        Analyze this weekly schedule image. Extract all the courses/classes.
        Return ONLY a valid JSON array of objects. Do not include markdown formatting (like ```json).
        Each object should have:
        - "day": Integer (0 for Monday, 1 for Tuesday, ... 6 for Sunday)
        - "start_time": String in "HH:MM" 24-hour format (e.g., "08:30")
        - "end_time": String in "HH:MM" 24-hour format (e.g., "09:20")
        - "course_name": String (e.g., "CS 101", "MATH 101 - Lecture")

        If a block spans multiple hours (e.g. 09:30-11:20), break it down or keep it as one, 
        but ensure the start and end times are accurate to the block. 
        If there are multiple pieces of info (Course Code, Room, Type), combine them into "course_name" 
        (e.g. "CS 101 - B208 - Lecture").
        """

        try:
            # Upload the file to Gemini
            sample_file = genai.upload_file(path=image_path, display_name="Schedule Image")
            
            # Generate content
            response = self.model.generate_content([sample_file, prompt])
            
            print(f"DEBUG: Raw Gemini Response: {response.text}", file=sys.stderr)

            # Clean response text (remove markdown if present)
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            
            return json.loads(text)
        except Exception as e:
            print(f"AI Parsing Error: {e}")
            return []
