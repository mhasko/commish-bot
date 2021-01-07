const CommandGroup = {
    ADMIN: 'admin',
    BASIC: 'basic',
    CAPTAIN: 'captain',
    NOTIFICATIONS: 'notifications',
    UTIL: 'util'
};

const Divisions = {
    "\u0031\u20E3": 'ionian',
    "\u0032\u20E3": 'shuriman',
    "\u0033\u20E3": 'freljord',
    "\u0034\u20E3": 'piltover',
    "\u0035\u20E3": 'noxian',
    "\u0036\u20E3": 'demacia'
};

const Emoji = {
    CHECKMARK: "\u2705",
    QUESTIONMARK: "\u2753" 
}

const MatchSide = {
    BLUE_SIDE: 0,
    RED_SIDE: 1
};

const MatchTypes = {
    WEEKLY: 1,
    PLAYOFFS: 2,
    OTHER: 3
};

const NumOfWeeks = [1,2,3,4,5,6,7];

const NumOfPlayoffs = ["0th Round", "1st Round", "2nd Round", "3rd Round", "4th Round"]

const ReactionNumbers = ["\u0030\u20E3","\u0031\u20E3","\u0032\u20E3","\u0033\u20E3","\u0034\u20E3","\u0035\u20E3", "\u0036\u20E3","\u0037\u20E3","\u0038\u20E3","\u0039\u20E3"];

module.exports = {CommandGroup, Divisions, Emoji, MatchSide, MatchTypes, NumOfWeeks, NumOfPlayoffs, ReactionNumbers};
