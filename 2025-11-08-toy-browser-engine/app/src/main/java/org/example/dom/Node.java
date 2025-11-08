package org.example.dom;

import java.util.*;


public class Node {
  public List<Node> children;
  public NodeType nodeType;

  public Node(List<Node> children, NodeType nodeType) {
    this.children = children;
    this.nodeType = nodeType;
  }

  public static Node text(String text) {
    return new Node(List.of(), new TextNode(text));
  }

  public static Node element(String tagName, Map<String, String> attributes, List<Node> children) {
    return new Node(children, new ElementNode(tagName, attributes));
  }
}
