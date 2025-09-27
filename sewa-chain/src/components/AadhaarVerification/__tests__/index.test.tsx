import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AadhaarVerification } from "../index";

// Mock Self Protocol components
jest.mock("@selfxyz/qrcode", () => ({
  SelfQRcodeWrapper: ({ onSuccess, onError }: any) => (
    <div data-testid="self-qr-wrapper">
      <button
        data-testid="mock-success"
        onClick={() => onSuccess({ mockData: "success" })}
      >
        Mock Success
      </button>
      <button
        data-testid="mock-error"
        onClick={() => onError({ message: "Mock error" })}
      >
        Mock Error
      </button>
    </div>
  ),
  SelfAppBuilder: jest.fn().mockImplementation(() => ({
    build: () => ({
      appName: "Test App",
      scope: "test-scope",
      endpoint: "https://test.com",
      version: 2,
      disclosures: {
        minimumAge: 18,
        nationality: true,
        gender: true,
      },
    }),
  })),
}));

jest.mock("@selfxyz/core", () => ({
  getUniversalLink: jest.fn().mockReturnValue("https://self.id/test-link"),
}));

describe("AadhaarVerification Component", () => {
  const mockOnVerified = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onVerified: mockOnVerified,
    onError: mockOnError,
    familyData: {
      headOfFamily: "Test Head of Family",
      familySize: 4,
      location: "Test Location",
      contactNumber: "+1234567890",
    },
  };

  it("renders initial state with instructions", () => {
    render(<AadhaarVerification {...defaultProps} />);

    expect(
      screen.getByText("Aadhaar Verification Required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Have your Aadhaar card ready"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Install Self Protocol app on your phone"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose QR code scanning or direct app opening"),
    ).toBeInTheDocument();
  });

  it("shows both QR code and Universal Link options", async () => {
    render(<AadhaarVerification {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Scan QR Code")).toBeInTheDocument();
      expect(screen.getByText("Open Self App")).toBeInTheDocument();
    });
  });

  it("starts verification when QR code button is clicked", async () => {
    render(<AadhaarVerification {...defaultProps} />);

    await waitFor(() => {
      const qrButton = screen.getByText("Scan QR Code");
      fireEvent.click(qrButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Scan this QR code with the Self Protocol app on your phone",
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId("self-qr-wrapper")).toBeInTheDocument();
    });
  });

  it("opens universal link when Open Self App button is clicked", async () => {
    // Mock window.open
    const mockOpen = jest.fn();
    Object.defineProperty(window, "open", {
      value: mockOpen,
      writable: true,
    });

    render(<AadhaarVerification {...defaultProps} />);

    await waitFor(() => {
      const universalLinkButton = screen.getByText("Open Self App");
      fireEvent.click(universalLinkButton);
    });

    expect(mockOpen).toHaveBeenCalledWith(
      "https://self.id/test-link",
      "_blank",
    );
  });

  it("handles successful verification", async () => {
    render(<AadhaarVerification {...defaultProps} />);

    // Start verification
    await waitFor(() => {
      const qrButton = screen.getByText("Scan QR Code");
      fireEvent.click(qrButton);
    });

    // Trigger success
    await waitFor(() => {
      const successButton = screen.getByTestId("mock-success");
      fireEvent.click(successButton);
    });

    // Wait for success state
    await waitFor(() => {
      expect(
        screen.getByText("Aadhaar verification completed successfully!"),
      ).toBeInTheDocument();
      expect(screen.getByText("✓ Nationality: IN")).toBeInTheDocument();
      expect(screen.getByText("✓ Age: 18+")).toBeInTheDocument();
      expect(screen.getByText("✓ Gender: M")).toBeInTheDocument();
    });

    expect(mockOnVerified).toHaveBeenCalled();
  });

  it("handles verification error", async () => {
    render(<AadhaarVerification {...defaultProps} />);

    // Start verification
    await waitFor(() => {
      const qrButton = screen.getByText("Scan QR Code");
      fireEvent.click(qrButton);
    });

    // Trigger error
    await waitFor(() => {
      const errorButton = screen.getByTestId("mock-error");
      fireEvent.click(errorButton);
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(new Error("Mock error"));
    });
  });

  it("shows privacy notice", () => {
    render(<AadhaarVerification {...defaultProps} />);

    expect(
      screen.getByText(/Your Aadhaar number is never stored/),
    ).toBeInTheDocument();
  });

  it("can be disabled", async () => {
    render(<AadhaarVerification {...defaultProps} disabled={true} />);

    await waitFor(() => {
      const qrButton = screen.getByText("Scan QR Code");
      expect(qrButton).toBeDisabled();
    });
  });
});
