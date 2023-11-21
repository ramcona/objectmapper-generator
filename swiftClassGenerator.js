function generateSwiftClass(
  json,
  className = "GeneratedClass",
  nullable = false
) {
  if (!json || typeof json !== "object") {
    console.error("Invalid JSON input");
    return "";
  }

  let swiftCode = ``;

  for (let [property, value] of Object.entries(json)) {
    swiftCode += `import ObjectMapper\n\npublic class ${className}: Mappable {\n\n`; //clas name
    swiftCode += `${generateProperties(json, className, nullable)}\n`; //properties
    swiftCode += `    public required init?(map: Map) {\n    }\n\n`; //init
    swiftCode += `    public init() {\n    }\n\n`; //init
    swiftCode += `    public func mapping(map: Map) {\n`; //mapping

    for (let [property, value] of Object.entries(json)) {
      //mapping value
      swiftCode += `        ${property} <- map["${property}"]\n`;
    }

    swiftCode += `    }\n\n`; //end of properties
    swiftCode += `}`; //end of line
    break; // Break the loop after processing the main class
  }

  return swiftCode;
}

function generateSwiftClassCodable(
  json,
  className = "GeneratedClass",
  nullable = false
) {
  if (!json || typeof json !== "object") {
    console.error("Invalid JSON input");
    return "";
  }

  let swiftCode = `struct ${className} : Codable {\n`;
  const isNullable = nullable ? "?" : "";

  for (let [property, value] of Object.entries(json)) {
    swiftCode += `    let ${property}: ${detectSwiftType(
      value
    )}${isNullable}\n`;
  }

  swiftCode += "\n";
  swiftCode += `    enum CodingKeys: String, CodingKey {\n`;

  for (let [property] of Object.entries(json)) {
    swiftCode += `        case ${property} = "${property}"\n`;
  }

  swiftCode += `    }\n\n`;

  swiftCode += `    init(from decoder: Decoder) throws {\n`;
  swiftCode += `        let values = try decoder.container(keyedBy: CodingKeys.self)\n\n`;

  for (let [property, value] of Object.entries(json)) {
    if (isNullable) {
      swiftCode += `        ${property} = try values.decodeIfPresent(${detectSwiftType(
        value
      )}.self, forKey: .${property})\n`;
    } else {
      swiftCode += `        ${property} = try values.decodeIfPresent(${detectSwiftType(
        value
      )}.self, forKey: .${property}) ?? ${getDefaultSwiftValue(value)}\n`;
    }
  }

  swiftCode += `    }\n\n`;

  swiftCode += "}\n";

  return swiftCode;
}

function generateProperties(json, className, nullable) {
  let propertiesCode = "";
  const isNullable = nullable ? "?" : "";

  for (let [property, value] of Object.entries(json)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        if (typeof value[0] === "object") {
          propertiesCode += `    public var ${property} : [${capitalizeFirstLetter(
            property
          )}]${isNullable} = []\n`;
        } else {
          propertiesCode += `    public var ${property} : [${detectArrayType(
            value
          )}]${isNullable} = [${detectArrayType(value)}]()\n`;
        }
      } else {
        propertiesCode += `    public var ${property}${isNullable} : [Any] = []\n`;
      }
    } else if (typeof value === "object" && value !== null) {
      const nestedClassName = capitalizeFirstLetter(property);
      propertiesCode += `    public var ${property}${isNullable} : ${nestedClassName} = ${nestedClassName}()\n`;
    } else {
      // Handle the case where data is null
      propertiesCode += `    public var ${property}${isNullable} : ${detectSwiftType(
        value
      )} = ${getDefaultSwiftValue(value)}\n`;
    }
  }

  return propertiesCode;
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
