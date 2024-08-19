const formattedDate = () => {
    return new Date().toLocaleString();
};

export const Logger = {
    log: (...args) => {
        console.log(formattedDate(), ...args);
    },
    error: (...args) => {
        console.error(formattedDate(), ...args);
    }
};
