const isBlockedUser = user => {
    if(user?.isBlocked){
        throw new Error (`Access Denied, ${user.firstName} is Blocked!`)
    }
}

module.exports = isBlockedUser;