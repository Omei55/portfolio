import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectMembers from './ProjectMembers';

// Mock fetch globally
global.fetch = jest.fn();

describe('ProjectMembers Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders project members title', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);
    
    expect(screen.getByText('Project Members')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProjectMembers />);
    
    expect(screen.getByText('Loading members...')).toBeInTheDocument();
  });

  test('displays members list when data is loaded', async () => {
    const mockMembers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Product Owner' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMembers,
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  test('displays empty state when no members', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText(/No members found/i)).toBeInTheDocument();
    });
  });

  test('opens add member modal when button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Member'));

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeInTheDocument();
    });
  });

  test('validates form fields when submitting empty form', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Member'));

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Add Member');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Member'));

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('Enter email address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    });

    const submitButton = screen.getByText('Add Member');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  test('calls POST API when adding a member', async () => {
    const mockMembers = [];
    const newMember = { id: 1, name: 'Test User', email: 'test@example.com', role: 'Developer' };

    // Mock GET members
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMembers,
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Member'));

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter member name'), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'test@example.com' }
    });

    // Mock POST response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newMember,
      headers: { get: () => 'application/json' }
    });

    // Mock GET members after add
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [newMember],
      headers: { get: () => 'application/json' }
    });

    const submitButton = screen.getByText('Add Member');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects/members',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            role: 'Developer'
          })
        })
      );
    });
  });

  test('opens delete confirmation modal when delete button is clicked', async () => {
    const mockMembers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMembers,
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Remove John Doe');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Remove Member')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();
    });
  });

  test('calls DELETE API when confirming member removal', async () => {
    const mockMembers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Developer' }
    ];

    // Mock GET members
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMembers,
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Remove John Doe');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Remove Member')).toBeInTheDocument();
    });

    // Mock DELETE response
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' }
    });

    // Mock GET members after delete
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
      headers: { get: () => 'application/json' }
    });

    const confirmButton = screen.getByText('Remove Member');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/projects/members/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  test('displays error message when API call fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load members/i)).toBeInTheDocument();
    });
  });

  test('displays success message after adding member', async () => {
    const mockMembers = [];
    const newMember = { id: 1, name: 'Test User', email: 'test@example.com', role: 'Developer' };

    // Mock GET members
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMembers,
      headers: { get: () => 'application/json' }
    });

    render(<ProjectMembers />);

    await waitFor(() => {
      expect(screen.getByText('+ Add Member')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Add Member'));

    await waitFor(() => {
      expect(screen.getByText('Add New Member')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter member name'), {
      target: { value: 'Test User' }
    });
    fireEvent.change(screen.getByPlaceholderText('Enter email address'), {
      target: { value: 'test@example.com' }
    });

    // Mock POST response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => newMember,
      headers: { get: () => 'application/json' }
    });

    // Mock GET members after add
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [newMember],
      headers: { get: () => 'application/json' }
    });

    const submitButton = screen.getByText('Add Member');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Member added successfully!')).toBeInTheDocument();
    });
  });
});

