import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

/**
 * Gera os itens de paginação com lógica de "..." (elipses).
 */
export const getPaginationItems = (currentPage: number, totalPages: number, siblingCount: number = 1): (number | string)[] => {
  const totalPageNumbers = siblingCount + 5; // siblingCount + first + last + current + 2*ellipsis

  // Caso 1: Se o número de páginas for menor que os números que queremos mostrar
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Calcular vizinhos da esquerda e direita
  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const firstPageIndex = 1;
  const lastPageIndex = totalPages;

  // Caso 2: Sem "..." à esquerda, mas com "..." à direita
  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", totalPages];
  }

  // Caso 3: Com "..." à esquerda, mas sem "..." à direita
  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
    return [firstPageIndex, "...", ...rightRange];
  }

  // Caso 4: Com "..." em ambos os lados
  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
    return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
  }
  
  // Fallback (não deve ser atingido)
  return [];
};