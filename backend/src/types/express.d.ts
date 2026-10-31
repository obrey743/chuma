declare global { namespace Express { interface Request { user?: { id: string; email: string }; membership?: { id: string; role: string; communityId: string } } } }
export {};
