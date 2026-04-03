function SelectField({ label, value, onChange, options, disabled, required }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none transition focus:border-tide disabled:opacity-60"
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({ label, value, onChange, placeholder, required }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-ink/15 bg-mist px-4 py-3 text-sm outline-none transition focus:border-tide"
      />
    </label>
  );
}

function needsLevel(requiredLevel, target) {
  const order = ['province', 'district', 'sector', 'cell', 'village'];
  return order.indexOf(requiredLevel) >= order.indexOf(target);
}

function LocationFieldGroup({
  title = 'Location',
  location,
  updateLocation,
  options,
  catalogAvailable,
  requiredLevel = 'village',
}) {
  const requiresDistrict = needsLevel(requiredLevel, 'district');
  const requiresSector = needsLevel(requiredLevel, 'sector');
  const requiresCell = needsLevel(requiredLevel, 'cell');
  const requiresVillage = needsLevel(requiredLevel, 'village');

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5">
      <p className="font-display text-xl font-black text-ink">{title}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InputField
          label="Country"
          value={location.country}
          onChange={(value) => updateLocation('country', value)}
          placeholder="Rwanda"
          required
        />
        <SelectField
          label="Province"
          value={location.province}
          onChange={(value) => updateLocation('province', value)}
          options={options.provinces}
          required
        />
      </div>

      {requiresDistrict ? (
        <div className="mt-4">
          <SelectField
            label="District"
            value={location.district}
            onChange={(value) => updateLocation('district', value)}
            options={options.districts}
            disabled={!location.province}
            required={requiresDistrict}
          />
        </div>
      ) : null}

      {requiresSector ? (
        <div className="mt-4">
          {catalogAvailable.sectors && options.sectors.length > 0 ? (
            <SelectField
              label="Sector"
              value={location.sector}
              onChange={(value) => updateLocation('sector', value)}
              options={options.sectors}
              disabled={!location.district}
              required={requiresSector}
            />
          ) : (
            <InputField
              label="Sector"
              value={location.sector}
              onChange={(value) => updateLocation('sector', value)}
              placeholder="Type sector name"
              required={requiresSector}
            />
          )}
        </div>
      ) : null}

      {requiresCell ? (
        <div className="mt-4">
          {catalogAvailable.cells && options.cells.length > 0 ? (
            <SelectField
              label="Cell"
              value={location.cell}
              onChange={(value) => updateLocation('cell', value)}
              options={options.cells}
              disabled={!location.sector}
              required={requiresCell}
            />
          ) : (
            <InputField
              label="Cell"
              value={location.cell}
              onChange={(value) => updateLocation('cell', value)}
              placeholder="Type cell name"
              required={requiresCell}
            />
          )}
        </div>
      ) : null}

      {requiresVillage ? (
        <div className="mt-4">
          {catalogAvailable.villages && options.villages.length > 0 ? (
            <SelectField
              label="Village"
              value={location.village}
              onChange={(value) => updateLocation('village', value)}
              options={options.villages}
              disabled={!location.cell}
              required={requiresVillage}
            />
          ) : (
            <InputField
              label="Village"
              value={location.village}
              onChange={(value) => updateLocation('village', value)}
              placeholder="Type village name"
              required={requiresVillage}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}

export default LocationFieldGroup;
