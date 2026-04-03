// Simple in-memory store — persists across navigation within a session

export type Application = {
  id: string;
  jobId: string;
  jobTitle: string;
  parentName: string;
  category: string;
  pay: string;
  note: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  appliedAt: string;
};

export type Listing = {
  id: string;
  title: string;
  category: string;
  pay: string;
  payType: 'hr' | 'flat';
  description: string;
  location: string;
  date: string;
  startTime: string;
  hours: string;
  recurring: boolean;
  frequency: string;
  teensNeeded: number;
  numKids: number;
  status: 'Active' | 'In Progress' | 'Completed';
  apps: number;
};

export type Review = {
  id: string;
  targetId: string; // job or user id
  author: string;
  stars: number;
  text: string;
};

export const applications: Application[] = [];
export const listings: Listing[] = [];
export const reviews: Review[] = [];

export function addApplication(app: Omit<Application, 'id' | 'appliedAt' | 'status'>) {
  applications.push({
    ...app,
    id: Date.now().toString(),
    status: 'Pending',
    appliedAt: new Date().toLocaleDateString(),
  });
}

export function updateApplicationStatus(id: string, status: Application['status']) {
  const app = applications.find(a => a.id === id);
  if (app) app.status = status;
}

export function addListing(l: Omit<Listing, 'id' | 'status' | 'apps'>) {
  listings.push({ ...l, id: Date.now().toString(), status: 'Active', apps: 0 });
}

export function addReview(r: Omit<Review, 'id'>) {
  reviews.push({ ...r, id: Date.now().toString() });
}

export function updateListingStatus(id: string, status: Listing['status']) {
  const l = listings.find(l => l.id === id);
  if (l) l.status = status;
}

// Seed fake listings for parent demo
export const FAKE_LISTINGS: (Listing & { applicants: number })[] = [
  { id: 'f1', title: 'Lawn Mowing', category: 'Yard Work', pay: '$20/hr', payType: 'hr', description: '', location: 'Oak St area', date: 'Apr 12', startTime: '10am', hours: '2', recurring: true, frequency: 'Weekly', teensNeeded: 1, numKids: 0, status: 'Active', apps: 3, applicants: 3 },
  { id: 'f2', title: 'Babysitting', category: 'Babysitting', pay: '$15/hr', payType: 'hr', description: '', location: 'Maple Ave area', date: 'Apr 14', startTime: '6pm', hours: '4', recurring: false, frequency: '', teensNeeded: 1, numKids: 2, status: 'In Progress', apps: 1, applicants: 1 },
  { id: 'f3', title: 'Dog Walking', category: 'Pet Care', pay: '$12/hr', payType: 'hr', description: '', location: 'Cedar Ln area', date: 'Apr 10', startTime: '8am', hours: '1', recurring: true, frequency: 'Weekly', teensNeeded: 1, numKids: 0, status: 'Completed', apps: 2, applicants: 2 },
];

// Seed fake applications for teen demo
export const FAKE_APPLICATIONS: Application[] = [
  { id: 'fa1', jobId: '1', jobTitle: 'Lawn Mowing', parentName: 'Sarah M.', category: 'Yard Work', pay: '$20/hr', note: '', status: 'Accepted', appliedAt: 'Apr 5' },
  { id: 'fa2', jobId: '3', jobTitle: 'Math Tutoring', parentName: 'Lisa K.', category: 'Tutoring', pay: '$25/hr', note: '', status: 'Pending', appliedAt: 'Apr 7' },
  { id: 'fa3', jobId: '4', jobTitle: 'Dog Walking', parentName: 'Mike R.', category: 'Pet Care', pay: '$12/hr', note: '', status: 'Accepted', appliedAt: 'Mar 28' },
];
