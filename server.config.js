module.exports = {
    PORT: process.env.PORT || 3000,
    SESSION_TIME_LIMIT: process.env.SESSION_TIME_LIMIT || 30,
    SERVICE_NAME: 'session_mapper',
    NEW_STATIC_FILES_PATH:process.env.NEW_STATIC_FILES_PATH || '/src/static/new',
    FAILED_STATIC_FILES_PATH:process.env.FAILED_STATIC_FILES_PATH || '/src/static/failed',
    FINISHED_STATIC_FILES_PATH:process.env.FINISHED_STATIC_FILES_PATH || '/src/static/finished',
};