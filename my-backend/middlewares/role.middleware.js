function roleMiddleWare(...roles) {
  return (request, response, next) => {
    const role = request.user.role;
    console.log(`[RoleMiddleware] User role: "${role}" | Required: [${roles.join(", ")}] | Path: ${request.originalUrl}`);
    if (!role) {
     return response.status(401).json({ message: "unauthorized.." }); 
    }
    if (!roles.includes(role)) {
      console.log(`[RoleMiddleware] ACCESS DENIED - User role "${role}" not in [${roles.join(", ")}]`);
      return response.status(403).json({ message: "access denied.." });
    }
    next();
  };
}

module.exports = { roleMiddleWare };