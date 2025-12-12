import requests
import sys
import time

BASE_URL = "http://127.0.0.1:5001/api"

def main():
    print("Verifying Real-Time Email Check...")
    
    ts = int(time.time())
    username = f"user_{ts}"
    email = f"check_{ts}@example.com"
    password = "password"
    
    # 1. Check NEW Email (Should be available)
    print(f"\nChecking NEW email {email}...")
    res = requests.post(f"{BASE_URL}/check-email", json={"email": email})
    if res.status_code == 200 and res.json().get("available") == True:
        print("SUCCESS: New email is available.")
    else:
        print(f"FAILED: Expected available=True, got {res.json()}")
        sys.exit(1)

    # 2. Register User
    print(f"\nRegistering user with {email}...")
    requests.post(f"{BASE_URL}/register", json={"username": username, "email": email, "password": password})

    # 3. Check EXISTING Email (Should be unavailable)
    print(f"\nChecking EXISTING email {email}...")
    res = requests.post(f"{BASE_URL}/check-email", json={"email": email})
    if res.status_code == 200 and res.json().get("available") == False:
        print("SUCCESS: Existing email is unavailable.")
    else:
        print(f"FAILED: Expected available=False, got {res.json()}")
        sys.exit(1)

    print("\nVerification Passed!")

if __name__ == "__main__":
    main()
