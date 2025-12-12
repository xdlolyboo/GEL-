from backend.ai_service import ScheduleParser
import google.generativeai as genai
import os

API_KEY = "AIzaSyAx1jebcbvowPnxZwkbE2efNe41ZGI8LJw"
IMAGE_PATH = "/Users/arifbaturalpozturk/.gemini/antigravity/brain/6f2a9609-3530-4578-bd11-3f3475375a3f/uploaded_image_0_1764108559163.jpg"

def main():
    genai.configure(api_key=API_KEY)
    print("Listing models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)

    print(f"Testing ScheduleParser with {IMAGE_PATH}")
    parser = ScheduleParser(API_KEY)
    
    try:
        items = parser.parse_schedule_image(IMAGE_PATH)
        print("Parsed Items:")
        print(items)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
