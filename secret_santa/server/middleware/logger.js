// ======================== REQUEST LOGGER MIDDLEWARE ========================
// Logs all incoming requests for debugging

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  
  console.log(`\n ======================== REQUEST ========================`);
  console.log(`Time: ${timestamp}`);
  console.log(` ${req.method} ${req.originalUrl}`);
  console.log(`Headers:`, {
    authorization: req.headers.authorization ? 'Present' : 'None',
    'content-type': req.headers['content-type'] || 'N/A'
  });
  
  if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
    console.log(`Body:`, req.body);
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log(`Query:`, req.query);
  }
  
  console.log(`========================================================\n`);
  
  next();
};

module.exports = logger;