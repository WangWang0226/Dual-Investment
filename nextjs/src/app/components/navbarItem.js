const NavbarItem = ({ icon, tokenName, balance}) => {
    return (
        <p className='flex flex-row content-primary'>
            <img src={icon} className="token-icon" />
            {tokenName}: {balance}
        </p>
    );
};

export default NavbarItem;