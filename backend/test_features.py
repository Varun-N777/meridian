import requests

BASE_URL = "http://localhost:8000"

def test_features():
    print("Testing Authentication...")
    try:
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@omnipulse.ai", "password": "admin123"})
        if resp.status_code == 200:
            token = resp.json().get("token")
            print("[OK] Authentication working")
        else:
            print(f"[FAIL] Auth: {resp.status_code} {resp.text}")
            return
    except Exception as e:
        print(f"[FAIL] Auth failed to connect: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing Analytics Overview...")
    resp = requests.get(f"{BASE_URL}/api/analytics/overview", headers=headers)
    print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Analytics Overview: {resp.status_code}")

    print("Testing Customers List...")
    resp = requests.get(f"{BASE_URL}/api/customers", headers=headers)
    print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Customers List: {resp.status_code}")
    
    cust_id = None
    if resp.status_code == 200 and isinstance(resp.json(), list) and len(resp.json()) > 0:
        cust_id = resp.json()[0]['customer_id']
        
    if cust_id:
        print(f"Testing Customer 360 for {cust_id}...")
        resp = requests.get(f"{BASE_URL}/api/customers/{cust_id}", headers=headers)
        print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Customer Profile: {resp.status_code}")
        
        print("Testing Intelligence Scores...")
        resp = requests.get(f"{BASE_URL}/api/ai/intelligence/{cust_id}", headers=headers)
        print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] AI Intelligence: {resp.status_code}")
        
        print("Testing NBA Engine...")
        resp = requests.get(f"{BASE_URL}/api/ai/nba/{cust_id}", headers=headers)
        print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] NBA Engine: {resp.status_code}")
        
        print("Testing Digital Twin...")
        resp = requests.get(f"{BASE_URL}/api/ai/digital-twin/{cust_id}", headers=headers)
        print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Digital Twin: {resp.status_code}")

    print("Testing Campaigns...")
    resp = requests.get(f"{BASE_URL}/api/campaigns", headers=headers)
    print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Campaigns: {resp.status_code}")

    print("Testing Copilot (Requires Gemini API Key)...")
    resp = requests.post(f"{BASE_URL}/api/copilot/chat", headers=headers, json={"message": "Hello"})
    print(f"[{'OK' if resp.status_code == 200 else 'FAIL'}] Copilot Chat: {resp.status_code}")

test_features()
