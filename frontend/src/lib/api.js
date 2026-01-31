import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Dashboard
export const getDashboardStats = () => axios.get(`${API}/dashboard/stats`, getAuthHeader());

// Company
export const getCompanySettings = () => axios.get(`${API}/company`, getAuthHeader());
export const updateCompanySettings = (data) => axios.put(`${API}/company`, data, getAuthHeader());

// Clients
export const getClients = () => axios.get(`${API}/clients`, getAuthHeader());
export const getClient = (id) => axios.get(`${API}/clients/${id}`, getAuthHeader());
export const createClient = (data) => axios.post(`${API}/clients`, data, getAuthHeader());
export const updateClient = (id, data) => axios.put(`${API}/clients/${id}`, data, getAuthHeader());
export const deleteClient = (id) => axios.delete(`${API}/clients/${id}`, getAuthHeader());

// Services
export const getServices = () => axios.get(`${API}/services`, getAuthHeader());
export const getService = (id) => axios.get(`${API}/services/${id}`, getAuthHeader());
export const createService = (data) => axios.post(`${API}/services`, data, getAuthHeader());
export const updateService = (id, data) => axios.put(`${API}/services/${id}`, data, getAuthHeader());
export const deleteService = (id) => axios.delete(`${API}/services/${id}`, getAuthHeader());

// Quotes
export const getQuotes = () => axios.get(`${API}/quotes`, getAuthHeader());
export const getQuote = (id) => axios.get(`${API}/quotes/${id}`, getAuthHeader());
export const createQuote = (data) => axios.post(`${API}/quotes`, data, getAuthHeader());
export const updateQuote = (id, data) => axios.put(`${API}/quotes/${id}`, data, getAuthHeader());
export const deleteQuote = (id) => axios.delete(`${API}/quotes/${id}`, getAuthHeader());
export const sendQuote = (id) => axios.post(`${API}/quotes/${id}/send`, {}, getAuthHeader());
export const getQuotePdf = (id) => axios.get(`${API}/quotes/${id}/pdf`, { ...getAuthHeader(), responseType: 'blob' });
export const convertQuoteToInvoice = (id) => axios.post(`${API}/quotes/${id}/convert-to-invoice`, {}, getAuthHeader());

// Invoices
export const getInvoices = () => axios.get(`${API}/invoices`, getAuthHeader());
export const getInvoice = (id) => axios.get(`${API}/invoices/${id}`, getAuthHeader());
export const getInvoicePdf = (id) => axios.get(`${API}/invoices/${id}/pdf`, { ...getAuthHeader(), responseType: 'blob' });
export const updateInvoiceStatus = (id, status) => axios.put(`${API}/invoices/${id}/status?status=${status}`, {}, getAuthHeader());
export const addPaymentToInvoice = (id, data) => axios.post(`${API}/invoices/${id}/payment`, data, getAuthHeader());
export const deletePayment = (invoiceId, paymentId) => axios.delete(`${API}/invoices/${invoiceId}/payment/${paymentId}`, getAuthHeader());
