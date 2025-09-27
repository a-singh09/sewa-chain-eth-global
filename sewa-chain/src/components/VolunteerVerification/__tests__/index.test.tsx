import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VolunteerVerification } from '@/components/VolunteerVerification';
import { VerificationLevel, VolunteerPermission } from '@/types';

// Mock MiniKit
const mockMiniKit = {
  isInstalled: jest.fn(() => true),
  commandsAsync: {
    verify: jest.fn()
  }
};

global.MiniKit = mockMiniKit;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockVolunteerSession = {
  nullifierHash: 'test-nullifier-hash',
  sessionToken: 'test-session-token',
  verificationLevel: VerificationLevel.Orb,
  timestamp: Date.now(),
  volunteerId: 'VOL_TEST123',
  permissions: [
    VolunteerPermission.DISTRIBUTE_AID,
    VolunteerPermission.VERIFY_BENEFICIARIES,
    VolunteerPermission.VIEW_DISTRIBUTION_DATA
  ],
  expiresAt: Date.now() + (24 * 60 * 60 * 1000),
  verifiedAt: Date.now()
};

const mockSuccessPayload = {
  status: 'success',
  nullifier_hash: 'test-nullifier-hash',
  merkle_root: 'test-merkle-root',
  proof: 'test-proof',
  verification_level: 'orb'
};

describe('VolunteerVerification Component', () => {
  const mockOnVerified = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockMiniKit.isInstalled.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('renders verification button in idle state', () => {
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    expect(screen.getByText('Verify as Volunteer (Orb)')).toBeInTheDocument();
    expect(screen.getByText('Orb Verification Required')).toBeInTheDocument();
  });

  test('shows error when MiniKit is not available', async () => {
    mockMiniKit.isInstalled.mockReturnValue(false);
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('World App is required for volunteer verification')).toBeInTheDocument();
    });
    
    expect(mockOnError).toHaveBeenCalledWith({
      code: 'MINIKIT_UNAVAILABLE',
      message: 'World App is required for volunteer verification',
      details: expect.any(Error)
    });
  });

  test('shows loading state during verification', async () => {
    // Mock a pending promise
    const pendingPromise = new Promise(() => {}); // Never resolves
    mockMiniKit.commandsAsync.verify.mockReturnValue(pendingPromise);
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Verifying with World ID...')).toBeInTheDocument();
    });
  });

  test('handles user cancellation', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: { status: 'error', error: 'user_cancelled' }
    });
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Verification was cancelled')).toBeInTheDocument();
    });
    
    expect(mockOnError).toHaveBeenCalledWith({
      code: 'USER_CANCELLED',
      message: 'Verification was cancelled',
      details: expect.any(Error)
    });
  });

  test('calls onVerified with session data on successful verification', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: mockSuccessPayload
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        volunteerSession: mockVolunteerSession
      })
    });
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Verification Complete!')).toBeInTheDocument();
    });
    
    expect(mockOnVerified).toHaveBeenCalledWith(mockVolunteerSession);
    expect(screen.getByText('Successfully verified as volunteer!')).toBeInTheDocument();
    expect(screen.getByText('Verified at Orb Level - Highest Security')).toBeInTheDocument();
  });

  test('handles backend verification failure', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: mockSuccessPayload
    });
    
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: {
          code: 'ALREADY_REGISTERED',
          message: 'This identity is already registered as a volunteer'
        }
      })
    });
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('This identity is already registered as a volunteer')).toBeInTheDocument();
    });
    
    expect(mockOnError).toHaveBeenCalledWith({
      code: 'ALREADY_REGISTERED',
      message: 'This identity is already registered as a volunteer',
      details: expect.any(Error)
    });
  });

  test('handles network errors', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: mockSuccessPayload
    });
    
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('World ID verification failed')).toBeInTheDocument();
    });
    
    expect(mockOnError).toHaveBeenCalled();
  });

  test('calls correct API endpoint with proper payload', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: mockSuccessPayload
    });
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        volunteerSession: mockVolunteerSession
      })
    });
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/verify-volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: mockSuccessPayload,
          action: 'verify-volunteer'
        })
      });
    });
  });

  test('error state auto-resets after 3 seconds', async () => {
    jest.useFakeTimers();
    
    mockMiniKit.isInstalled.mockReturnValue(false);
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('World App is required for volunteer verification')).toBeInTheDocument();
    });
    
    // Fast-forward 3 seconds
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.getByText('Verify as Volunteer (Orb)')).toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });

  test('respects disabled prop', () => {
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
        disabled={true}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    expect(button).toBeDisabled();
  });

  test('applies custom className', () => {
    const customClass = 'custom-test-class';
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
        className={customClass}
      />
    );
    
    const container = screen.getByText('Verify as Volunteer (Orb)').closest('.custom-test-class');
    expect(container).toHaveClass(customClass);
  });

  test('sends verification with Orb level requirement', async () => {
    mockMiniKit.commandsAsync.verify.mockResolvedValue({
      finalPayload: mockSuccessPayload
    });
    
    render(
      <VolunteerVerification 
        onVerified={mockOnVerified} 
        onError={mockOnError}
      />
    );
    
    const button = screen.getByText('Verify as Volunteer (Orb)');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockMiniKit.commandsAsync.verify).toHaveBeenCalledWith({
        action: 'verify-volunteer',
        verification_level: VerificationLevel.Orb
      });
    });
  });
});"