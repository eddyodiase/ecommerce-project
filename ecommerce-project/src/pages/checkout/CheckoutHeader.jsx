import "./CheckoutHeader.css";

export function CheckoutHeader() {
  return (
    <div className="checkout-header">
      <div className="header-content">
        <div className="checkout-header-left-section">
          <a href="/">
            <img className="logo" src="/images/logo.png" alt="logo" />
            <img className="mobile-logo" src="/images/mobile-logo.png" alt="mobile logo" />
          </a>
        </div>
        <div className="checkout-header-middle-section">
          Checkout (<a className="return-to-home-link" href="/">3 items</a>)
        </div>
        <div className="checkout-header-right-section">
          <img src="/images/icons/checkout-lock-icon.png" alt="secure checkout" />
        </div>
      </div>
    </div>
  );
}
