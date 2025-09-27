import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FamilyRegistrationPage from "../page";

// Mock the Page component
jest.mock("@/components/PageLayout", () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Main: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <main className={className}>{children}</main>,
}));

// Mock the AadhaarVerification component
jest.mock("@/components/AadhaarVerification", () => ({
  AadhaarVerification: () => (
    <div data-testid="aadhaar-verification">Aadhaar Verification</div>
  ),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Family Registration Dropdown", () => {
  test("renders location dropdown with all Indian states", () => {
    render(<FamilyRegistrationPage />);

    const locationSelect = screen.getByRole("combobox", { name: /location/i });
    expect(locationSelect).toBeInTheDocument();

    // Check if placeholder is present
    expect(screen.getByText("Select your state")).toBeInTheDocument();
  });

  test("dropdown allows state selection", () => {
    render(<FamilyRegistrationPage />);

    const locationSelect = screen.getByRole("combobox", { name: /location/i });

    // Select a state
    fireEvent.change(locationSelect, { target: { value: "Maharashtra" } });

    expect(locationSelect).toHaveValue("Maharashtra");
  });

  test("form validation works with dropdown selection", () => {
    render(<FamilyRegistrationPage />);

    // Fill in required fields
    const nameInput = screen.getByPlaceholderText("Enter full name");
    const familySizeInput = screen.getByDisplayValue("1");
    const locationSelect = screen.getByRole("combobox", { name: /location/i });
    const contactInput = screen.getByPlaceholderText("+91 XXXXXXXXXX");

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(familySizeInput, { target: { value: "4" } });
    fireEvent.change(locationSelect, { target: { value: "Karnataka" } });
    fireEvent.change(contactInput, { target: { value: "+91 9876543210" } });

    // Submit form
    const submitButton = screen.getByText("Continue to Aadhaar Verification");
    fireEvent.click(submitButton);

    // Should proceed to next step
    expect(screen.getByText("Aadhaar Verification")).toBeInTheDocument();
  });
});
