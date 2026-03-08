function roleMiddleWare(...roles) {
  return (request, response, next) => {
    const role = request.user.role;
    if (!role) {
     return response.status(401).json({ message: "unauthorized.." }); 
    }
    if (!roles.includes(role)) {
      return response.status(403).json({ message: "access denied.." });
    }
    next();
  };
}

module.exports = { roleMiddleWare };