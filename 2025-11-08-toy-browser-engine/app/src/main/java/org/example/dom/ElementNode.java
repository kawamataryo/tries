package org.example.dom;

import java.util.Map;
import java.util.List;

public final class ElementNode implements NodeType {
  public String tagName;
  public Map<String, String> attributes;
  public List<Node> children;

  public ElementNode(String tagName, Map<String, String> attributes) {
    this.tagName = tagName;
    this.attributes = attributes;
  }
}
