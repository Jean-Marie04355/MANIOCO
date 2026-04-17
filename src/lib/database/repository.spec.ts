import { AbstractRepository } from './repository';

describe('AbstractRepository', () => {
  let repository: AbstractRepository<any>;
  let repoMock: any;

  beforeEach(() => {
    repoMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      softDelete: jest.fn(),
    };
    repository = new AbstractRepository(repoMock);
  });

  it('should call find', async () => {
    await repository.find({});
    expect(repoMock.find).toHaveBeenCalledWith({});
  });

  it('should call findOne', async () => {
    await repository.findOne({ id: 1 });
    expect(repoMock.findOne).toHaveBeenCalledWith({ id: 1 });
  });

  it('should call create and save', async () => {
    repoMock.create.mockResolvedValue({ id: 1 });
    repoMock.save.mockResolvedValue({ id: 1 });
    const result = await repository.create({ name: 'test' });
    expect(result.id).toBe(1);
    expect(repoMock.create).toHaveBeenCalledWith({ name: 'test' });
    expect(repoMock.save).toHaveBeenCalled();
  });

  it('should call createMany and save multiple times', async () => {
    repoMock.create.mockResolvedValue({});
    repoMock.save.mockResolvedValue({});
    await repository.createMany([{ name: '1' }, { name: '2' }]);
    expect(repoMock.create).toHaveBeenCalledTimes(2);
    expect(repoMock.save).toHaveBeenCalledTimes(2);
  });

  it('should call update', async () => {
    await repository.update(1, { name: 'u' });
    expect(repoMock.update).toHaveBeenCalledWith(1, { name: 'u' });
  });

  it('should call delete', async () => {
    await repository.delete(1);
    expect(repoMock.delete).toHaveBeenCalledWith(1);
  });

  it('should call count', async () => {
    await repository.count();
    expect(repoMock.count).toHaveBeenCalled();
  });

  it('should call softDelete', async () => {
    await repository.softDelete(1);
    expect(repoMock.softDelete).toHaveBeenCalledWith(1);
  });

  it('should call save', async () => {
    await repository.save({ id: 1 });
    expect(repoMock.save).toHaveBeenCalledWith({ id: 1 });
  });
});
