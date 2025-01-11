import re


def parse_expression(expression):
    """
    Parse a logical expression like "alfabetiere AND (carli OR cottarelli)" into a MongoDB query.
    """
    # Tokenize the input expression
    tokens = re.findall(r'\w+|\(|\)|AND|OR', expression)

    def parse_tokens(tokens):
        """Recursively parse tokens into a MongoDB query."""
        stack = []
        current = []
        operator = None

        while tokens:
            token = tokens.pop(0)

            if token == '(':
                # Recursively parse sub-expression
                sub_query = parse_tokens(tokens)
                current.append(sub_query)
            elif token == ')':
                # End of sub-expression
                break
            elif token in ('AND', 'OR'):
                operator = token
            else:
                # Regular token, assume it represents a term
                if operator == 'OR':
                    if isinstance(current[-1], dict):
                        current[-1] = {"$or": [current[-1]]}
                    current[-1]["$or"].append({"descrizione": {"$regex": token, "$options": "i"}})
                else:
                    current.append({"descrizione": {"$regex": token, "$options": "i"}})

            # Handle "AND" logic explicitly
            if operator == 'AND' and len(current) > 1:
                if len(stack) > 0 and isinstance(stack[-1], dict) and "$and" in stack[-1]:
                    stack[-1]["$and"].append(current.pop(0))
                else:
                    stack.append({"$and": current})
                    current = []

        # Combine remaining terms with "AND" if necessary
        if len(current) > 1:
            stack.append({"$and": current})
        elif current:
            stack.extend(current)

        return stack[0] if len(stack) == 1 else {"$and": stack}

    # Initialize parsing
    query = parse_tokens(tokens)

    # If the root query is a single term, wrap it in "$text"
    if isinstance(query, dict) and "descrizione" in query:
        return {"$text": {"$search": query["descrizione"]["$regex"]}}

    return query


# Example usage
# expression = "alfabetiere AND (carli OR cottarelli)"
# query = parse_expression(expression)
# print(query)
