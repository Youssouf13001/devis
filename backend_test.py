#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for DevisPro French Quote Management System
Tests all CRUD operations, authentication, PDF generation, and email functionality
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class DevisProAPITester:
    def __init__(self, base_url: str = "https://biz-estimator-2.preview.emergentagent.com"):
        self.base_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data storage
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_client_id = None
        self.test_service_id = None
        self.test_quote_id = None
        self.test_invoice_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, f"Unsupported method: {method}", {}

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return success, f"Status: {response.status_code}", response_data

        except Exception as e:
            return False, f"Request failed: {str(e)}", {}

    # ============ AUTHENTICATION TESTS ============
    
    def test_user_registration(self):
        """Test user registration"""
        data = {
            "email": self.test_user_email,
            "password": "TestPassword123!",
            "name": "Test User DevisPro"
        }
        
        success, details, response = self.make_request("POST", "auth/register", data, 200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("User Registration", True, f"User created with ID: {self.user_id}")
            return True
        else:
            self.log_test("User Registration", False, details, response)
            return False

    def test_user_login(self):
        """Test user login"""
        data = {
            "email": self.test_user_email,
            "password": "TestPassword123!"
        }
        
        success, details, response = self.make_request("POST", "auth/login", data, 200)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("User Login", True, "Login successful")
            return True
        else:
            self.log_test("User Login", False, details, response)
            return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        success, details, response = self.make_request("GET", "auth/me", expected_status=200)
        
        if success and 'email' in response:
            self.log_test("Get User Profile", True, f"Profile retrieved for: {response['email']}")
            return True
        else:
            self.log_test("Get User Profile", False, details, response)
            return False

    # ============ COMPANY SETTINGS TESTS ============
    
    def test_get_company_settings(self):
        """Test getting company settings"""
        success, details, response = self.make_request("GET", "company", expected_status=200)
        
        if success and 'name' in response:
            self.log_test("Get Company Settings", True, f"Company: {response['name']}")
            return True
        else:
            self.log_test("Get Company Settings", False, details, response)
            return False

    def test_update_company_settings(self):
        """Test updating company settings"""
        data = {
            "name": "CREATIVINDUSTRY TEST",
            "email": "test@creativindustry.com",
            "phone": "06 12 34 56 78"
        }
        
        success, details, response = self.make_request("PUT", "company", data, 200)
        
        if success and response.get('name') == data['name']:
            self.log_test("Update Company Settings", True, "Company settings updated")
            return True
        else:
            self.log_test("Update Company Settings", False, details, response)
            return False

    # ============ CLIENTS TESTS ============
    
    def test_create_client(self):
        """Test creating a client"""
        data = {
            "name": "Client Test SARL",
            "address": "123 Rue de Test, 13000 Marseille",
            "email": "client.test@example.com",
            "phone": "04 91 12 34 56"
        }
        
        success, details, response = self.make_request("POST", "clients", data, 200)
        
        if success and 'id' in response:
            self.test_client_id = response['id']
            self.log_test("Create Client", True, f"Client created with ID: {self.test_client_id}")
            return True
        else:
            self.log_test("Create Client", False, details, response)
            return False

    def test_get_clients(self):
        """Test getting all clients"""
        success, details, response = self.make_request("GET", "clients", expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("Get Clients", True, f"Retrieved {len(response)} clients")
            return True
        else:
            self.log_test("Get Clients", False, details, response)
            return False

    def test_get_client_by_id(self):
        """Test getting specific client"""
        if not self.test_client_id:
            self.log_test("Get Client by ID", False, "No client ID available")
            return False
            
        success, details, response = self.make_request("GET", f"clients/{self.test_client_id}", expected_status=200)
        
        if success and response.get('id') == self.test_client_id:
            self.log_test("Get Client by ID", True, f"Client retrieved: {response['name']}")
            return True
        else:
            self.log_test("Get Client by ID", False, details, response)
            return False

    def test_update_client(self):
        """Test updating a client"""
        if not self.test_client_id:
            self.log_test("Update Client", False, "No client ID available")
            return False
            
        data = {
            "name": "Client Test SARL - Updated",
            "address": "456 Rue de Test Modifiée, 13000 Marseille",
            "email": "client.test.updated@example.com",
            "phone": "04 91 98 76 54"
        }
        
        success, details, response = self.make_request("PUT", f"clients/{self.test_client_id}", data, 200)
        
        if success and response.get('name') == data['name']:
            self.log_test("Update Client", True, "Client updated successfully")
            return True
        else:
            self.log_test("Update Client", False, details, response)
            return False

    # ============ SERVICES TESTS ============
    
    def test_create_service(self):
        """Test creating a service"""
        data = {
            "name": "Prestation Photo Test",
            "unit": "heure",
            "price_ht": 75.00,
            "tva_rate": 20.0,
            "description": "Prestation de photographie professionnelle"
        }
        
        success, details, response = self.make_request("POST", "services", data, 200)
        
        if success and 'id' in response:
            self.test_service_id = response['id']
            self.log_test("Create Service", True, f"Service created with ID: {self.test_service_id}")
            return True
        else:
            self.log_test("Create Service", False, details, response)
            return False

    def test_get_services(self):
        """Test getting all services"""
        success, details, response = self.make_request("GET", "services", expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("Get Services", True, f"Retrieved {len(response)} services")
            return True
        else:
            self.log_test("Get Services", False, details, response)
            return False

    def test_update_service(self):
        """Test updating a service"""
        if not self.test_service_id:
            self.log_test("Update Service", False, "No service ID available")
            return False
            
        data = {
            "name": "Prestation Photo Test - Updated",
            "unit": "jour",
            "price_ht": 500.00,
            "tva_rate": 20.0,
            "description": "Prestation de photographie professionnelle - tarif journée"
        }
        
        success, details, response = self.make_request("PUT", f"services/{self.test_service_id}", data, 200)
        
        if success and response.get('name') == data['name']:
            self.log_test("Update Service", True, "Service updated successfully")
            return True
        else:
            self.log_test("Update Service", False, details, response)
            return False

    # ============ QUOTES TESTS ============
    
    def test_create_quote(self):
        """Test creating a quote"""
        if not self.test_client_id or not self.test_service_id:
            self.log_test("Create Quote", False, "Missing client or service ID")
            return False
            
        expiration_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        data = {
            "client_id": self.test_client_id,
            "expiration_date": expiration_date,
            "items": [
                {
                    "service_name": "Prestation Photo Test - Updated",
                    "quantity": 2.0,
                    "unit": "jour",
                    "price_ht": 500.00,
                    "tva_rate": 20.0
                }
            ],
            "discount": 50.0,
            "notes": "Devis de test pour validation API"
        }
        
        success, details, response = self.make_request("POST", "quotes", data, 200)
        
        if success and 'id' in response:
            self.test_quote_id = response['id']
            self.log_test("Create Quote", True, f"Quote created with ID: {self.test_quote_id}, Number: {response.get('quote_number')}")
            return True
        else:
            self.log_test("Create Quote", False, details, response)
            return False

    def test_get_quotes(self):
        """Test getting all quotes"""
        success, details, response = self.make_request("GET", "quotes", expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("Get Quotes", True, f"Retrieved {len(response)} quotes")
            return True
        else:
            self.log_test("Get Quotes", False, details, response)
            return False

    def test_update_quote_status(self):
        """Test updating quote status"""
        if not self.test_quote_id:
            self.log_test("Update Quote Status", False, "No quote ID available")
            return False
            
        data = {"status": "accepté"}
        
        success, details, response = self.make_request("PUT", f"quotes/{self.test_quote_id}", data, 200)
        
        if success and response.get('status') == 'accepté':
            self.log_test("Update Quote Status", True, "Quote status updated to 'accepté'")
            return True
        else:
            self.log_test("Update Quote Status", False, details, response)
            return False

    def test_quote_pdf_generation(self):
        """Test PDF generation for quote"""
        if not self.test_quote_id:
            self.log_test("Quote PDF Generation", False, "No quote ID available")
            return False
            
        try:
            url = f"{self.base_url}/quotes/{self.test_quote_id}/pdf"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                self.log_test("Quote PDF Generation", True, f"PDF generated successfully, size: {len(response.content)} bytes")
                return True
            else:
                self.log_test("Quote PDF Generation", False, f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
                return False
        except Exception as e:
            self.log_test("Quote PDF Generation", False, f"Error: {str(e)}")
            return False

    def test_send_quote_email(self):
        """Test sending quote via email (will fail without valid SendGrid config)"""
        if not self.test_quote_id:
            self.log_test("Send Quote Email", False, "No quote ID available")
            return False
            
        # First reset quote to draft status
        self.make_request("PUT", f"quotes/{self.test_quote_id}", {"status": "brouillon"}, 200)
        
        success, details, response = self.make_request("POST", f"quotes/{self.test_quote_id}/send", {}, expected_status=200)
        
        if success:
            self.log_test("Send Quote Email", True, "Quote sent successfully")
            return True
        else:
            # This might fail due to SendGrid configuration, which is expected in test environment
            self.log_test("Send Quote Email", False, f"Expected failure in test env: {details}")
            return False

    # ============ INVOICES TESTS ============
    
    def test_convert_quote_to_invoice(self):
        """Test converting quote to invoice"""
        if not self.test_quote_id:
            self.log_test("Convert Quote to Invoice", False, "No quote ID available")
            return False
            
        # Ensure quote is in accepted status
        self.make_request("PUT", f"quotes/{self.test_quote_id}", {"status": "accepté"}, 200)
        
        success, details, response = self.make_request("POST", f"quotes/{self.test_quote_id}/convert-to-invoice", {}, 200)
        
        if success and 'id' in response:
            self.test_invoice_id = response['id']
            self.log_test("Convert Quote to Invoice", True, f"Invoice created with ID: {self.test_invoice_id}, Number: {response.get('invoice_number')}")
            return True
        else:
            self.log_test("Convert Quote to Invoice", False, details, response)
            return False

    def test_get_invoices(self):
        """Test getting all invoices"""
        success, details, response = self.make_request("GET", "invoices", expected_status=200)
        
        if success and isinstance(response, list):
            self.log_test("Get Invoices", True, f"Retrieved {len(response)} invoices")
            return True
        else:
            self.log_test("Get Invoices", False, details, response)
            return False

    def test_update_invoice_status(self):
        """Test updating invoice status"""
        if not self.test_invoice_id:
            self.log_test("Update Invoice Status", False, "No invoice ID available")
            return False
            
        success, details, response = self.make_request("PUT", f"invoices/{self.test_invoice_id}/status?status=payée", {}, 200)
        
        if success:
            self.log_test("Update Invoice Status", True, "Invoice status updated to 'payée'")
            return True
        else:
            self.log_test("Update Invoice Status", False, details, response)
            return False

    # ============ DASHBOARD TESTS ============
    
    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, details, response = self.make_request("GET", "dashboard/stats", expected_status=200)
        
        if success and 'total_quotes' in response:
            stats = response
            self.log_test("Dashboard Stats", True, 
                f"Stats: {stats['total_quotes']} quotes, {stats['total_clients']} clients, {stats['total_services']} services, Revenue: {stats['total_revenue']}€")
            return True
        else:
            self.log_test("Dashboard Stats", False, details, response)
            return False

    # ============ CLEANUP TESTS ============
    
    def test_cleanup(self):
        """Clean up test data"""
        cleanup_success = True
        
        # Delete quote (this should also handle related data)
        if self.test_quote_id:
            success, _, _ = self.make_request("DELETE", f"quotes/{self.test_quote_id}", expected_status=200)
            if not success:
                cleanup_success = False
        
        # Delete service
        if self.test_service_id:
            success, _, _ = self.make_request("DELETE", f"services/{self.test_service_id}", expected_status=200)
            if not success:
                cleanup_success = False
        
        # Delete client
        if self.test_client_id:
            success, _, _ = self.make_request("DELETE", f"clients/{self.test_client_id}", expected_status=200)
            if not success:
                cleanup_success = False
        
        self.log_test("Cleanup Test Data", cleanup_success, "Test data cleanup completed")
        return cleanup_success

    # ============ HEALTH CHECK ============
    
    def test_health_check(self):
        """Test API health check"""
        success, details, response = self.make_request("GET", "health", expected_status=200)
        
        if success and response.get('status') == 'healthy':
            self.log_test("Health Check", True, f"API is healthy: {response.get('service')}")
            return True
        else:
            self.log_test("Health Check", False, details, response)
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting DevisPro API Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🔗 Testing API: {self.base_url}")
        print("=" * 80)
        
        # Health check first
        self.test_health_check()
        
        # Authentication flow
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return self.get_results()
        
        if not self.test_user_login():
            print("❌ Login failed, stopping tests")
            return self.get_results()
        
        self.test_get_user_profile()
        
        # Company settings
        self.test_get_company_settings()
        self.test_update_company_settings()
        
        # Clients CRUD
        self.test_create_client()
        self.test_get_clients()
        self.test_get_client_by_id()
        self.test_update_client()
        
        # Services CRUD
        self.test_create_service()
        self.test_get_services()
        self.test_update_service()
        
        # Quotes CRUD and operations
        self.test_create_quote()
        self.test_get_quotes()
        self.test_update_quote_status()
        self.test_quote_pdf_generation()
        self.test_send_quote_email()  # Expected to fail in test env
        
        # Invoices
        self.test_convert_quote_to_invoice()
        self.test_get_invoices()
        self.test_update_invoice_status()
        
        # Dashboard
        self.test_dashboard_stats()
        
        # Cleanup
        self.test_cleanup()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 80)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            failed_tests = [r for r in self.test_results if not r['success']]
            print(f"❌ {len(failed_tests)} tests failed:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
            return 1

def main():
    """Main test execution"""
    tester = DevisProAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())