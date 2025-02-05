
export default function PriceBanner({price}) {

    return (
        <div className="price-simulator-container">
            <h1 className="h1 mr-8">Current PUPU Coin Price: </h1>
            <p className="title-primary ">
                ${price.toFixed(2)}
            </p>
        </div>
    );
}
