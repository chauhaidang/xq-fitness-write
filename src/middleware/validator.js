const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      const details = error.details.map((detail) => detail.message);
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        timestamp: new Date().toISOString(),
        details,
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = validate;
