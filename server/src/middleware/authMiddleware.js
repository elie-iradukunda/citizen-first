import { getSession, removeSession, updateSession } from '../data/sessionStore.js';
import { systemUsers } from '../data/registrationData.js';

function getBearerToken(request) {
  const authorizationHeader = request.get('authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

export function getAuthUserFromRequest(request) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  const session = getSession(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
    removeSession(token);
    return null;
  }

  const user = systemUsers.find((entry) => entry.userId === session.userId && entry.status === 'active');
  if (!user) {
    removeSession(token);
    return null;
  }

  updateSession(token, {
    ...session,
    lastSeenAt: new Date().toISOString(),
  });

  return {
    token,
    session,
    user,
  };
}

export function requireAuth(request, response, next) {
  const authContext = getAuthUserFromRequest(request);

  if (!authContext) {
    return response.status(401).json({
      message: 'Authentication required. Please login.',
    });
  }

  request.auth = authContext;
  return next();
}

export function requireRoles(roles) {
  return (request, response, next) => {
    if (!request.auth?.user) {
      return response.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(request.auth.user.role)) {
      return response.status(403).json({
        message: 'You do not have permission for this resource.',
      });
    }

    return next();
  };
}
