const NavbarItem = ({ icon, tokenName, balance}) => {
    return (
        <p className='navbar-item'>
            <img src={icon} className="token-icon" />
            {tokenName}: {balance}
        </p>
    );
};

export default NavbarItem;