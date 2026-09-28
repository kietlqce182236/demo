import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classesApi } from '../api/classes';
import { ClassFilters, ClassData } from '../types';

export const useClasses = (filters: ClassFilters) => {
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => classesApi.getClasses(filters),
  });
};

export const useClass = (id: string) => {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: () => classesApi.getClass(id),
    enabled: !!id,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: Partial<ClassData>) => classesApi.createClass(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ClassData> }) =>
      classesApi.updateClass(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes', variables.id] });
    },
  });
};
