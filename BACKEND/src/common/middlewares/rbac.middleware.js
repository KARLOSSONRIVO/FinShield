import AppError from "../errors/AppErrors.js";

export function allowRoles(...roles){
    return(req, _res, next) => {
        if(!req.auth) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
        if (!roles.includes(req.auth.role)) {return next(new AppError("Forbidden", 403, "FORBIDDEN_ROLE"))}
          next()
        }
}


export function allowPortals(...portals) {
    return (req, _res, next) => {
      if (!req.auth) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
      if (!portals.includes(req.auth.portal)) {return next(new AppError("Forbidden", 403, "FORBIDDEN_PORTAL"))}
      next()
    };
  }

  export function enforceMustChangePassword({ exceptPaths = [] } = {}) {
    return (req, _res, next) => {
      if (!req.auth) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
  
      if (req.auth.mustChangePassword) {
        const current = (req.baseUrl + req.path).replace(/\/$/, '') || '/'
        const allowed = exceptPaths.some(p => {
          if (typeof p === 'string') return current === p || current.startsWith(p + '/')
          // { method, path } — exact path + method match
          return req.method === p.method && current === p.path
        })
        if (!allowed) {
          return next(new AppError("Password change required", 403, "MUST_CHANGE_PASSWORD"))
        }
      }
  
      next()
    };
  }


  export function requireSameOrgParam(paramName = "orgId") {
    return (req, _res, next) => {
      if (!req.auth) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
  
      if (req.auth.role === "SUPER_ADMIN") return next()
  
      const param = req.params[paramName]
      if (!param) return next(new AppError(`Missing param ${paramName}`, 400, "MISSING_PARAM"))
  
      if (String(param) !== String(req.auth.orgId)) {return next(new AppError("Forbidden", 403, "FORBIDDEN_ORG_SCOPE"))}
  
      next()
    };
  }