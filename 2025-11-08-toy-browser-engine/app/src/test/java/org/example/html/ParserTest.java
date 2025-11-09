package org.example.html;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

import java.util.List;

import org.example.dom.Node;
import org.example.dom.ElementNode;
import org.example.dom.TextNode;
import org.junit.jupiter.api.Test;

class ParserTest {

  @Test
  void parseNode_parseNodes() throws Exception {
    Parser parser = new Parser("""
        <div class="container" id="main">
          <h1>Title</h1>
          <p class="text">Hello <span>world</span>!</p>
          <ul>
            <li>Item 1</li>
            <li class="active">Item 2</li>
          </ul>
        </div>
        """.trim());

    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    // Root div element
    Node divNode = nodes.get(0);
    assertInstanceOf(ElementNode.class, divNode.nodeType);
    assertEquals("div", ((ElementNode) divNode.nodeType).tagName);
    assertEquals(3, divNode.children.size());
    assertEquals("container", ((ElementNode) divNode.nodeType).attributes.get("class"));
    assertEquals("main", ((ElementNode) divNode.nodeType).attributes.get("id"));
    
    // h1 element
    Node h1Node = divNode.children.get(0);
    assertInstanceOf(ElementNode.class, h1Node.nodeType);
    assertEquals("h1", ((ElementNode) h1Node.nodeType).tagName);
    assertEquals(1, h1Node.children.size());
    assertInstanceOf(TextNode.class, h1Node.children.get(0).nodeType);
    assertEquals("Title", ((TextNode) h1Node.children.get(0).nodeType).text);
    
    // p element
    Node pNode = divNode.children.get(1);
    assertInstanceOf(ElementNode.class, pNode.nodeType);
    assertEquals("p", ((ElementNode) pNode.nodeType).tagName);
    assertEquals(3, pNode.children.size());
    assertEquals("text", ((ElementNode) pNode.nodeType).attributes.get("class"));
    
    // p element children: "Hello ", span, "!"
    assertInstanceOf(TextNode.class, pNode.children.get(0).nodeType);
    assertEquals("Hello ", ((TextNode) pNode.children.get(0).nodeType).text);
    
    Node spanNode = pNode.children.get(1);
    assertInstanceOf(ElementNode.class, spanNode.nodeType);
    assertEquals("span", ((ElementNode) spanNode.nodeType).tagName);
    assertEquals(1, spanNode.children.size());
    assertInstanceOf(TextNode.class, spanNode.children.get(0).nodeType);
    assertEquals("world", ((TextNode) spanNode.children.get(0).nodeType).text);
    
    assertInstanceOf(TextNode.class, pNode.children.get(2).nodeType);
    assertEquals("!", ((TextNode) pNode.children.get(2).nodeType).text);
    
    // ul element
    Node ulNode = divNode.children.get(2);
    assertInstanceOf(ElementNode.class, ulNode.nodeType);
    assertEquals("ul", ((ElementNode) ulNode.nodeType).tagName);
    assertEquals(2, ulNode.children.size());
    
    // First li element
    Node li1Node = ulNode.children.get(0);
    assertInstanceOf(ElementNode.class, li1Node.nodeType);
    assertEquals("li", ((ElementNode) li1Node.nodeType).tagName);
    assertEquals(1, li1Node.children.size());
    assertInstanceOf(TextNode.class, li1Node.children.get(0).nodeType);
    assertEquals("Item 1", ((TextNode) li1Node.children.get(0).nodeType).text);
    
    // Second li element
    Node li2Node = ulNode.children.get(1);
    assertInstanceOf(ElementNode.class, li2Node.nodeType);
    assertEquals("li", ((ElementNode) li2Node.nodeType).tagName);
    assertEquals(1, li2Node.children.size());
    assertInstanceOf(TextNode.class, li2Node.children.get(0).nodeType);
    assertEquals("Item 2", ((TextNode) li2Node.children.get(0).nodeType).text);
    assertEquals("active", ((ElementNode) li2Node.nodeType).attributes.get("class"));
  }
}
