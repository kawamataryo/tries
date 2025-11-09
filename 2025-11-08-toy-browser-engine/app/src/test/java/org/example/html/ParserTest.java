package org.example.html;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

  @Test
  void parseNodes_emptyInput() throws Exception {
    Parser parser = new Parser("");
    List<Node> nodes = parser.parseNodes();
    assertEquals(0, nodes.size());
  }

  @Test
  void parseNodes_whitespaceOnly() throws Exception {
    Parser parser = new Parser("   \n\t  ");
    List<Node> nodes = parser.parseNodes();
    assertEquals(0, nodes.size());
  }

  @Test
  void parseNodes_textOnly() throws Exception {
    Parser parser = new Parser("Hello World");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    assertInstanceOf(TextNode.class, nodes.get(0).nodeType);
    assertEquals("Hello World", ((TextNode) nodes.get(0).nodeType).text);
  }

  @Test
  void parseNodes_singleElementNoAttributes() throws Exception {
    Parser parser = new Parser("<div>Content</div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    assertInstanceOf(ElementNode.class, divNode.nodeType);
    assertEquals("div", ((ElementNode) divNode.nodeType).tagName);
    assertTrue(((ElementNode) divNode.nodeType).attributes.isEmpty());
    assertEquals(1, divNode.children.size());
    assertEquals("Content", ((TextNode) divNode.children.get(0).nodeType).text);
  }

  @Test
  void parseNodes_emptyElement() throws Exception {
    Parser parser = new Parser("<div></div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    assertInstanceOf(ElementNode.class, divNode.nodeType);
    assertEquals("div", ((ElementNode) divNode.nodeType).tagName);
    assertEquals(0, divNode.children.size());
  }

  @Test
  void parseNodes_multipleRootElements() throws Exception {
    Parser parser = new Parser("<h1>Title</h1><p>Paragraph</p>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(2, nodes.size());
    
    Node h1Node = nodes.get(0);
    assertInstanceOf(ElementNode.class, h1Node.nodeType);
    assertEquals("h1", ((ElementNode) h1Node.nodeType).tagName);
    assertEquals("Title", ((TextNode) h1Node.children.get(0).nodeType).text);
    
    Node pNode = nodes.get(1);
    assertInstanceOf(ElementNode.class, pNode.nodeType);
    assertEquals("p", ((ElementNode) pNode.nodeType).tagName);
    assertEquals("Paragraph", ((TextNode) pNode.children.get(0).nodeType).text);
  }

  @Test
  void parseNodes_deepNesting() throws Exception {
    Parser parser = new Parser("<div><span><em>Deep</em></span></div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    assertEquals(1, divNode.children.size());
    
    Node spanNode = divNode.children.get(0);
    assertInstanceOf(ElementNode.class, spanNode.nodeType);
    assertEquals("span", ((ElementNode) spanNode.nodeType).tagName);
    assertEquals(1, spanNode.children.size());
    
    Node emNode = spanNode.children.get(0);
    assertInstanceOf(ElementNode.class, emNode.nodeType);
    assertEquals("em", ((ElementNode) emNode.nodeType).tagName);
    assertEquals(1, emNode.children.size());
    assertEquals("Deep", ((TextNode) emNode.children.get(0).nodeType).text);
  }

  @Test
  void parseNodes_emptyAttributeValue() throws Exception {
    Parser parser = new Parser("<div class=\"\">Content</div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    assertEquals("", ((ElementNode) divNode.nodeType).attributes.get("class"));
  }

  @Test
  void parseNodes_multipleAttributes() throws Exception {
    Parser parser = new Parser("<div id=\"main\" class=\"container\" data=\"123\">Content</div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    ElementNode elementNode = (ElementNode) divNode.nodeType;
    assertEquals("main", elementNode.attributes.get("id"));
    assertEquals("container", elementNode.attributes.get("class"));
    assertEquals("123", elementNode.attributes.get("data"));
    assertEquals(3, elementNode.attributes.size());
  }

  @Test
  void parseNodes_textWithWhitespace() throws Exception {
    Parser parser = new Parser("<div>  Hello   World  </div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node divNode = nodes.get(0);
    assertEquals(1, divNode.children.size());
    // パーサーは要素の開始タグの後の空白を消費するため、先頭の空白は保持されない
    assertEquals("Hello   World  ", ((TextNode) divNode.children.get(0).nodeType).text);
  }

  @Test
  void parseNodes_mixedTextAndElements() throws Exception {
    Parser parser = new Parser("Before<div>Inside</div>After");
    List<Node> nodes = parser.parseNodes();
    assertEquals(3, nodes.size());
    
    assertEquals("Before", ((TextNode) nodes.get(0).nodeType).text);
    assertEquals("div", ((ElementNode) nodes.get(1).nodeType).tagName);
    assertEquals("After", ((TextNode) nodes.get(2).nodeType).text);
  }

  @Test
  void parseNodes_numericTagName() throws Exception {
    Parser parser = new Parser("<h1>Title</h1>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    assertEquals("h1", ((ElementNode) nodes.get(0).nodeType).tagName);
  }

  @Test
  void parseNodes_attributeWithSpecialCharacters() throws Exception {
    Parser parser = new Parser("<div class=\"test-class\" id=\"test_id\">Content</div>");
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    ElementNode elementNode = (ElementNode) nodes.get(0).nodeType;
    assertEquals("test-class", elementNode.attributes.get("class"));
    assertEquals("test_id", elementNode.attributes.get("id"));
  }

  @Test
  void parseNodes_complexStructure() throws Exception {
    Parser parser = new Parser("""
        <html>
          <head>
            <title>Test</title>
          </head>
          <body>
            <header>
              <nav>
                <a href="/">Home</a>
              </nav>
            </header>
            <main>
              <article>
                <h1>Article Title</h1>
                <p>Article content</p>
              </article>
            </main>
          </body>
        </html>
        """.trim());
    
    List<Node> nodes = parser.parseNodes();
    assertEquals(1, nodes.size());
    
    Node htmlNode = nodes.get(0);
    assertEquals("html", ((ElementNode) htmlNode.nodeType).tagName);
    assertEquals(2, htmlNode.children.size());
    
    Node headNode = htmlNode.children.get(0);
    assertEquals("head", ((ElementNode) headNode.nodeType).tagName);
    assertEquals(1, headNode.children.size());
    
    Node titleNode = headNode.children.get(0);
    assertEquals("title", ((ElementNode) titleNode.nodeType).tagName);
    assertEquals("Test", ((TextNode) titleNode.children.get(0).nodeType).text);
    
    Node bodyNode = htmlNode.children.get(1);
    assertEquals("body", ((ElementNode) bodyNode.nodeType).tagName);
    assertEquals(2, bodyNode.children.size());
  }
}
