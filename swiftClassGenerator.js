function generateSwiftClass(
  json,
  className = "GeneratedClass",
  nullable = false,
  caseType = "camelCase"
) {
  if (!json || typeof json !== "object") {
    console.error("Invalid JSON input");
    return "";
  }

  let swiftCode = ``;

  swiftCode += `import ObjectMapper\n\npublic class ${className}: Mappable {\n\n`; // Class name
  swiftCode += `${generateProperties(json, className, caseType, nullable)}\n`; // Properties
  swiftCode += `    public required init?(map: Map) {\n    }\n\n`; // Init
  swiftCode += `    public init() {\n    }\n\n`; // Init
  swiftCode += `    public func mapping(map: Map) {\n`; // Mapping

  for (let [property, value] of Object.entries(json)) {
    // Mapping value
    let propertyName = convertToCase(property, caseType);
    swiftCode += `        ${propertyName} <- map["${property}"]\n`;
  }

  swiftCode += `    }\n\n`; // End of properties
  swiftCode += `}`; // End of class

  return swiftCode;
}

function generateSwiftClassCodable(
  json,
  className = "GeneratedClass",
  nullable = false,
  caseType = "camelCase" // Default to camelCase if not provided
) {
  if (!json || typeof json !== "object") {
    console.error("Invalid JSON input");
    return "";
  }

  let swiftCode = `struct ${className} : Codable {\n`;
  const isNullable = nullable ? "?" : "";

  for (let [property, value] of Object.entries(json)) {
    let propertyName = "";

    // Convert property name based on the specified caseType
    if (caseType === "snake_case") {
      propertyName = property.toLowerCase().replace(/ /g, "_");
    } else if (caseType === "PascalCase") {
      propertyName = capitalizeFirstLetter(property).replace(/ /g, "");
    } else if (caseType === "camelCase") {
      propertyName = (
        property.charAt(0).toLowerCase() + property.slice(1)
      ).replace(/ /g, "");
    }

    swiftCode += `    let ${propertyName}: ${detectSwiftType(
      value
    )}${isNullable}\n`;
  }

  swiftCode += "\n";
  swiftCode += `    enum CodingKeys: String, CodingKey {\n`;

  for (let [property] of Object.entries(json)) {
    let propertyName = "";

    // Convert property name based on the specified caseType
    if (caseType === "snake_case") {
      propertyName = property.toLowerCase().replace(/ /g, "_");
    } else if (caseType === "PascalCase") {
      propertyName = capitalizeFirstLetter(property);
    } else if (caseType === "camelCase") {
      propertyName = property.charAt(0).toLowerCase() + property.slice(1);
    }

    swiftCode += `        case ${propertyName.replace(
      / /g,
      ""
    )} = "${property}"\n`;
  }

  swiftCode += `    }\n\n`;

  swiftCode += `    init(from decoder: Decoder) throws {\n`;
  swiftCode += `        let values = try decoder.container(keyedBy: CodingKeys.self)\n\n`;

  for (let [property, value] of Object.entries(json)) {
    let propertyName = "";

    // Convert property name based on the specified caseType
    if (caseType === "snake_case") {
      propertyName = property.toLowerCase().replace(/ /g, "_");
    } else if (caseType === "PascalCase") {
      propertyName = capitalizeFirstLetter(property);
    } else if (caseType === "camelCase") {
      propertyName = property.charAt(0).toLowerCase() + property.slice(1);
    }

    if (nullable) {
      swiftCode += `        ${propertyName.replace(
        / /g,
        ""
      )} = try values.decodeIfPresent(${detectSwiftType(
        value
      )}.self, forKey: .${propertyName.replace(/ /g, "")})\n`;
    } else {
      swiftCode += `        ${propertyName.replace(
        / /g,
        ""
      )} = try values.decodeIfPresent(${detectSwiftType(
        value
      )}.self, forKey: .${propertyName.replace(
        / /g,
        ""
      )}) ?? ${getDefaultSwiftValue(value)}\n`;
    }
  }

  swiftCode += `    }\n\n`;

  swiftCode += "}\n";

  return swiftCode;
}

function generateProperties(json, className, caseType, nullable) {
  let propertiesCode = "";
  const isNullable = nullable ? "?" : "";

  for (let [property, value] of Object.entries(json)) {
    let propertyName = convertToCase(property, caseType);

    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "object") {
        propertiesCode += `    public var ${propertyName} : ${capitalizeFirstLetter(
          propertyName
        )}${isNullable} = ${capitalizeFirstLetter(propertyName)}()\n`;
      } else {
        propertiesCode += `    public var ${propertyName} : [${detectArrayType(
          value
        )}]${isNullable} = [${detectArrayType(value)}]()\n`;
      }
    } else if (typeof value === "object" && value !== null) {
      propertiesCode += `    public var ${propertyName} : ${capitalizeFirstLetter(
        propertyName
      )}${isNullable} = ${capitalizeFirstLetter(propertyName)}()\n`;
    } else {
      propertiesCode += `    public var ${propertyName}${isNullable} : ${detectSwiftType(
        value
      )} = ${getDefaultSwiftValue(value)}\n`;
    }
  }

  return propertiesCode;
}

function convertToCase(property, caseType) {
  if (caseType === "snake_case") {
    return property.toLowerCase().replace(/ /g, "_");
  } else if (caseType === "PascalCase") {
    return capitalizeFirstLetter(property.replace(/ /g, ""));
  } else if (caseType === "camelCase") {
    return (property.charAt(0).toLowerCase() + property.slice(1)).replace(
      / /g,
      ""
    );
  }
}

function detectSwiftType(value) {
  if (value === null) return "Any";
  if (typeof value === "string") return "String";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return "Int";
    return Number(value) === value && value % 1 !== 0 ? "Float" : "Double";
  }
  if (typeof value === "boolean") return "Bool";
  return "Any";
}

function detectArrayType(array) {
  if (array.length > 0) {
    return detectSwiftType(array[0]);
  }
  return "Any";
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDefaultSwiftValue(value) {
  if (typeof value === "string") return `""`;
  if (typeof value === "number" || typeof value === "boolean") return `0`;
  if (value === null) return `nil`;
  return `nil`;
}

module.exports = { generateSwiftClass, generateSwiftClassCodable };
