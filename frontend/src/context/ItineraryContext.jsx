/**
 * ItineraryContext — Global state store for the Itinerary Builder
 * 
 * DATA FLOW:
 * 1. PackageBookingPage → dispatches HYDRATE_FROM_PACKAGE with package data
 * 2. BuilderScreen → reads packageData on mount, generates mock trip, dispatches SET_TRIP
 * 3. TimelineView → reads trip.stops[selectedStopId].activities per day
 * 4. ItineraryBuilder → reads trip.stops for the left panel list
 * 
 * STATE SHAPE:
 * {
 *   trip: { id, name, stops: [...], total_budget, ... } | null,
 *   selectedStopId: string | null,
 *   packageData: { destId, pkg, tier, startDate } | null,  ← set by PackageBookingPage
 *   isHydrating: boolean  ← true while converting packageData into a full trip
 * }
 */
import { createContext, useContext, useReducer } from 'react';

// ─── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  trip: null,
  selectedStopId: null,
  packageData: null,   // Holds pre-fill data from package selection
  isHydrating: false,  // Loading flag during package → builder hydration
};

// ─── Action Types ──────────────────────────────────────────────────────────────
const actions = {
  SET_TRIP: 'SET_TRIP',
  SET_SELECTED_STOP: 'SET_SELECTED_STOP',
  HYDRATE_FROM_PACKAGE: 'HYDRATE_FROM_PACKAGE',
  SET_HYDRATING: 'SET_HYDRATING',
  CLEAR_PACKAGE_DATA: 'CLEAR_PACKAGE_DATA',
  RESET: 'RESET',
};

// ─── Reducer ───────────────────────────────────────────────────────────────────
function itineraryReducer(state, action) {
  switch (action.type) {
    case actions.SET_TRIP:
      return { ...state, trip: action.payload, isHydrating: false };

    case actions.SET_SELECTED_STOP:
      return { ...state, selectedStopId: action.payload };

    case actions.HYDRATE_FROM_PACKAGE:
      // Store the raw package data for BuilderScreen to consume on mount
      // packageData shape: { destId, selectedPackage, selectedTier, startDate, destination }
      return { ...state, packageData: action.payload, isHydrating: true };

    case actions.SET_HYDRATING:
      return { ...state, isHydrating: action.payload };

    case actions.CLEAR_PACKAGE_DATA:
      return { ...state, packageData: null };

    case actions.RESET:
      return initialState;

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────
const ItineraryContext = createContext(null);

// ─── Provider ──────────────────────────────────────────────────────────────────
export function ItineraryProvider({ children }) {
  const [state, dispatch] = useReducer(itineraryReducer, initialState);

  return (
    <ItineraryContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </ItineraryContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useItinerary() {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }
  return context;
}

export { actions as ACTIONS };
export default ItineraryContext;
