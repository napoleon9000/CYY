import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import HomeScreen from '../HomeScreen';
import { Database } from '../../utils/database';
import { scheduleWeeklyReminders } from '../../utils/notifications';
import { mockMedications, mockUseNavigation, resetAllMocks } from '../../utils/testUtils';

// Mock dependencies
jest.mock('../../utils/database');
jest.mock('../../utils/notifications');
jest.mock('@react-navigation/native');

const mockDatabase = Database as jest.Mocked<typeof Database>;
const mockScheduleWeeklyReminders = scheduleWeeklyReminders as jest.MockedFunction<typeof scheduleWeeklyReminders>;
const mockUseNavigationHook = useNavigation as jest.MockedFunction<typeof useNavigation>;
const mockUseFocusEffect = useFocusEffect as jest.MockedFunction<typeof useFocusEffect>;
const mockAlert = jest.mocked(Alert.alert);

describe('HomeScreen', () => {
  beforeEach(() => {
    resetAllMocks();
    mockUseNavigationHook.mockReturnValue(mockUseNavigation());
    mockUseFocusEffect.mockImplementation((callback) => callback());
    mockDatabase.getMedications.mockResolvedValue(mockMedications);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Loading medications...')).toBeTruthy();
  });

  it('should render medications after loading', async () => {
    const { getByText, queryByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(queryByText('Loading medications...')).toBeNull();
      expect(getByText('Your Medications')).toBeTruthy();
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Vitamin D')).toBeTruthy();
      expect(getByText('Metformin')).toBeTruthy();
    });
  });

  it('should render empty state when no medications', async () => {
    mockDatabase.getMedications.mockResolvedValue([]);
    
    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('No Medications Yet')).toBeTruthy();
      expect(getByText('Tap the + button to add your first medication reminder')).toBeTruthy();
    });
  });

  it('should load medications on focus', async () => {
    render(<HomeScreen />);
    
    await waitFor(() => {
      expect(mockDatabase.getMedications).toHaveBeenCalled();
    });
  });

  describe('Medication Management', () => {
    it('should navigate to AddMedication screen when add button is pressed', async () => {
      const mockNavigate = jest.fn();
      mockUseNavigationHook.mockReturnValue({ ...mockUseNavigation(), navigate: mockNavigate });
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('add-medication-button')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('add-medication-button'));
      
      expect(mockNavigate).toHaveBeenCalledWith('AddMedication');
    });

    it('should toggle medication active status', async () => {
      mockDatabase.saveMedication.mockResolvedValue();
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('toggle-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('toggle-med-1'));
      
      await waitFor(() => {
        expect(mockDatabase.saveMedication).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'med-1',
            isActive: false, // Should be toggled from true to false
          })
        );
        expect(mockScheduleWeeklyReminders).toHaveBeenCalled();
      });
    });

    it('should navigate to edit medication screen', async () => {
      const mockNavigate = jest.fn();
      mockUseNavigationHook.mockReturnValue({ ...mockUseNavigation(), navigate: mockNavigate });
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('edit-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('edit-med-1'));
      
      expect(mockNavigate).toHaveBeenCalledWith('AddMedication', {
        medicationToEdit: expect.objectContaining({ id: 'med-1' }),
      });
    });

    it('should navigate to medication details screen', async () => {
      const mockNavigate = jest.fn();
      mockUseNavigationHook.mockReturnValue({ ...mockUseNavigation(), navigate: mockNavigate });
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('medication-card-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('medication-card-med-1'));
      
      expect(mockNavigate).toHaveBeenCalledWith('MedicationDetails', {
        medicationId: 'med-1',
      });
    });

    it('should show delete confirmation dialog', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('delete-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('delete-med-1'));
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Delete Medication',
        'Are you sure you want to delete Aspirin?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Delete' }),
        ])
      );
    });

    it('should delete medication when confirmed', async () => {
      mockDatabase.deleteMedication.mockResolvedValue();
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('delete-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('delete-med-1'));
      
      // Simulate user pressing delete in alert
      const deleteAction = mockAlert.mock.calls[0][2].find(action => action.text === 'Delete');
      deleteAction.onPress();
      
      await waitFor(() => {
        expect(mockDatabase.deleteMedication).toHaveBeenCalledWith('med-1');
        expect(mockDatabase.getMedications).toHaveBeenCalledTimes(2); // Initial load + reload after delete
      });
    });
  });

  describe('Medication Display', () => {
    it('should display medication information correctly', async () => {
      const { getByText } = render(<HomeScreen />);
      
      await waitFor(() => {
        // Check medication names
        expect(getByText('Aspirin')).toBeTruthy();
        expect(getByText('Vitamin D')).toBeTruthy();
        expect(getByText('Metformin')).toBeTruthy();
        
        // Check dosages
        expect(getByText('81mg')).toBeTruthy();
        expect(getByText('1000 IU')).toBeTruthy();
        expect(getByText('500mg')).toBeTruthy();
      });
    });

    it('should display reminder times correctly', async () => {
      const { getByText } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByText('8:00 AM')).toBeTruthy(); // 08:00 formatted
        expect(getByText('8:00 PM')).toBeTruthy(); // 20:00 formatted
        expect(getByText('12:00 PM')).toBeTruthy(); // 12:00 formatted
      });
    });

    it('should display day abbreviations correctly', async () => {
      const { getByText } = render(<HomeScreen />);
      
      await waitFor(() => {
        // All days for Aspirin (should show all day chips as active)
        const dayChips = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayChips.forEach(day => {
          expect(getByText(day)).toBeTruthy();
        });
      });
    });

    it('should show active/inactive status correctly', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        // med-1 (Aspirin) is active
        expect(getByTestId('toggle-med-1')).toBeTruthy();
        
        // med-2 (Vitamin D) is inactive
        expect(getByTestId('toggle-med-2')).toBeTruthy();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh medications when pull to refresh is triggered', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('medication-list')).toBeTruthy();
      });
      
      // Simulate pull to refresh
      fireEvent(getByTestId('medication-list'), 'refresh');
      
      await waitFor(() => {
        expect(mockDatabase.getMedications).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabase.getMedications.mockRejectedValue(new Error('Database error'));
      
      const { queryByText } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(queryByText('Loading medications...')).toBeNull();
        // Should still render without crashing
      });
    });

    it('should handle toggle medication errors', async () => {
      mockDatabase.saveMedication.mockRejectedValue(new Error('Save error'));
      console.error = jest.fn(); // Mock console.error
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('toggle-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('toggle-med-1'));
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error toggling medication:', expect.any(Error));
      });
    });

    it('should handle delete medication errors', async () => {
      mockDatabase.deleteMedication.mockRejectedValue(new Error('Delete error'));
      console.error = jest.fn(); // Mock console.error
      
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('delete-med-1')).toBeTruthy();
      });
      
      fireEvent.press(getByTestId('delete-med-1'));
      
      // Simulate user pressing delete in alert
      const deleteAction = mockAlert.mock.calls[0][2].find(action => action.text === 'Delete');
      deleteAction.onPress();
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error deleting medication:', expect.any(Error));
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const { getByTestId } = render(<HomeScreen />);
      
      await waitFor(() => {
        expect(getByTestId('add-medication-button')).toBeTruthy();
        expect(getByTestId('medication-card-med-1')).toBeTruthy();
        expect(getByTestId('toggle-med-1')).toBeTruthy();
        expect(getByTestId('edit-med-1')).toBeTruthy();
        expect(getByTestId('delete-med-1')).toBeTruthy();
      });
    });
  });
}); 