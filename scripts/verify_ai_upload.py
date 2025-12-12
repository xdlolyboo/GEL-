import requests
import sys
import os

BASE_URL = "http://127.0.0.1:5001/api"
# Use one of the uploaded images. I'll assume one exists in the artifacts folder or I'll use a dummy path if not.
# Wait, the user uploaded images to the chat, but I need a local path.
# I will use the path from the metadata: /Users/arifbaturalpozturk/.gemini/antigravity/brain/6f2a9609-3530-4578-bd11-3f3475375a3f/uploaded_image_0_1764108559163.jpg

IMAGE_PATH = "/Users/arifbaturalpozturk/.gemini/antigravity/brain/6f2a9609-3530-4578-bd11-3f3475375a3f/uploaded_image_0_1764108559163.jpg"

def main():
    print("Verifying AI Schedule Upload...")
    
    # 1. Login to get token
    print("Logging in...")
    try:
        res = requests.post(f"{BASE_URL}/login", json={"username": "ai_tester", "password": "password"})
        if res.status_code == 401: # Register if not exists
             requests.post(f"{BASE_URL}/register", json={"username": "ai_tester", "email": "ai@test.com", "password": "password"})
             res = requests.post(f"{BASE_URL}/login", json={"username": "ai_tester", "password": "password"})
        
        token = res.json()['access_token']
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

    # 2. Upload Image
    print(f"Uploading {IMAGE_PATH}...")
    if not os.path.exists(IMAGE_PATH):
        print(f"File not found: {IMAGE_PATH}")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {token}"}
    files = {'file': open(IMAGE_PATH, 'rb')}
    
    try:
        res = requests.post(f"{BASE_URL}/schedule/upload", headers=headers, files=files)
        if res.status_code == 201:
            print("SUCCESS: Schedule parsed.")
            items = res.json().get('items', [])
            print(f"Found {len(items)} items.")
            for item in items[:3]: # Print first 3
                print(f"- {item['day_of_week']} {item['start_time']}-{item['end_time']}: {item['course_name']}")
        else:
            print(f"FAILED: {res.status_code} - {res.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Upload failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
