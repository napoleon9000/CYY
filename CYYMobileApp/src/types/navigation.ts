/**
 * Navigation types for the CYY Mobile App
 * Provides type safety for React Navigation
 */

import { Medication } from './medication';

/**
 * Root stack navigator parameter list
 */
export type RootStackParamList = {
  MainTabs: undefined;
  AddMedication: { medication?: Medication };
  MedicationDetails: { medicationId: string };
  Camera: { medicationId: string };
  Login: undefined;
  Friends: undefined;
  AddFriend: undefined;
  FriendMedicationDetail: {
    friendId: string;
    medicationId: string;
    friendName: string;
  };
};

/**
 * Bottom tab navigator parameter list
 */
export type BottomTabParamList = {
  Home: undefined;
  Add: undefined;
  Track: undefined;
  Friends: undefined;
  Settings: undefined;
};

/**
 * Navigation route names
 */
export const ROUTE_NAMES = {
  MAIN_TABS: 'MainTabs',
  ADD_MEDICATION: 'AddMedication',
  MEDICATION_DETAILS: 'MedicationDetails',
  CAMERA: 'Camera',
  HOME: 'Home',
  ADD: 'Add',
  TRACK: 'Track',
  FRIENDS: 'Friends',
  SETTINGS: 'Settings',
  LOGIN: 'Login',
  ADD_FRIEND: 'AddFriend',
  FRIEND_MEDICATION_DETAIL: 'FriendMedicationDetail',
} as const;

/**
 * Tab bar icon configurations
 */
export const TAB_ICONS = {
  HOME: 'house',
  ADD: 'plus.circle',
  TRACK: 'checkmark.circle',
  FRIENDS: 'people',
  SETTINGS: 'gear',
} as const;