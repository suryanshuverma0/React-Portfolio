import { useEffect, useState } from "react";

import api from "../lib/axios";

/*
  Public products, one shared request for the homepage (numbering) and the
  Products section. Empty until loaded or if there are none.
*/

let request = null;

const loadProducts = () => {
  if (!request) {
    request = api
      .get("/products/public")
      .then((r) => (Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {
        request = null;
        return [];
      });
  }
  return request;
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    loadProducts().then((list) => alive && setProducts(list));
    return () => {
      alive = false;
    };
  }, []);

  return products;
};
