const FIELDS = [
  { key: "fullName", label: "Full name", autoComplete: "name", required: true },
  { key: "email", label: "Email address", autoComplete: "email", type: "email", required: true },
  { key: "phone", label: "Phone number", autoComplete: "tel", type: "tel", required: true },
  { key: "addressLine1", label: "Street address", autoComplete: "address-line1", required: true },
  { key: "addressLine2", label: "Apartment, suite, landmark (optional)", autoComplete: "address-line2" },
  { key: "city", label: "City", autoComplete: "address-level2", required: true },
  { key: "state", label: "State", autoComplete: "address-level1", required: true },
  { key: "postalCode", label: "Postal code (optional)", autoComplete: "postal-code" },
];

export function ShippingAddressForm({ address, errors = {}, onChange }) {
  return (
    <section className="shipping-address-form" aria-labelledby="shipping-address-title">
      <div id="shipping-address-title" className="shipping-address-title">Shipping address</div>
      {FIELDS.map(({ key, label, autoComplete, type = "text", required }) => (
        <div className="shipping-address-field" key={key}>
          <label htmlFor={`shipping-${key}`}>{label}</label>
          <input
            id={`shipping-${key}`}
            name={key}
            type={type}
            autoComplete={autoComplete}
            required={required}
            value={address[key] || ""}
            aria-invalid={Boolean(errors[key])}
            onChange={(event) => onChange(key, event.target.value)}
          />
          {errors[key] && <div className="shipping-address-error" role="alert">{errors[key]}</div>}
        </div>
      ))}
    </section>
  );
}
