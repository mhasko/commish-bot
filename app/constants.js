const CommandGroup = {
    ADMIN: 'admin',
    BASIC: 'basic',
    NOTIFICATIONS: 'notifications',
    UTIL: 'util'
};

const Divisions = {
    IONIAN: 0,
    SHURIMAN: 1,
    NOXIAN: 2,
    DEMACIAN: 3
};

const MatchSide = {
    BLUE_SIDE: 0,
    RED_SIDE: 1
};

const ReactionNumbers = ["\u0030\u20E3","\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3","\u0038\u20E3","\u0039\u20E3"]

module.exports = {CommandGroup, Divisions, MatchSide, ReactionNumbers};
