import requests
import json

def test_login():
    url = 'http://localhost:8004/token'
    
    # Setup Form Data for login
    data = {
        'username': 'sharathkumar',
        'password': 'skcheruku@1'
    }
    
    print(f"Trying to login with username: {data['username']}")
    
    try:
        # Use form-encoded data for the token endpoint
        response = requests.post(url, data=data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("Login Successful!")
            print(f"Token Type: {result.get('token_type')}")
            print(f"Role: {result.get('role')}")
            print(f"Token length: {len(result.get('access_token', ''))}")
            return True
        else:
            print("Login Failed!")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False
        
if __name__ == "__main__":
    test_login() 