const passport = require('passport');
const Utils = require('../../utils');
const AuthUtil = require('../../utils/auth');
const HttpUtil = require('../../utils/http');

module.exports = {
  login(req, res) {
    const requireParams = ['email', 'password'];
    let params = HttpUtil.getRequiredParamsFromJson2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);

    req.body = Utils.getAcceptableFields(params, requireParams);

    passport.authenticate('local', (err, user, info) => {
      // If Passport throws/catches an error
      if (err) {
        return HttpUtil.unauthorized(res, err);
      }
      // If a user is found
      if (user) {
        let token = AuthUtil.generateJwt(user);
        user = user.getFields();

        return HttpUtil.success(res, {message: 'Login successfully.', token: token, user: user});
      }
      // If user is not found
      return HttpUtil.unauthorized(res, info);
    })(req, res);
  }
};
