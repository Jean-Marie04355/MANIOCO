import { SqlRepository } from './repository';

describe('SqlRepository', () => {
  let repository: SqlRepository<any>;
  let repoMock: any;

  beforeEach(() => {
    repoMock = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({ id: '1' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
      softDelete: jest.fn().mockResolvedValue({}),
    };
    repository = new SqlRepository(repoMock);
  });

  it('should call find', async () => {
    const result = await repository.find({});
    expect(repoMock.find).toHaveBeenCalledWith({
      where: {},
      withDeleted: false,
    });
    expect(result).toEqual([]);
  });

  it('should call findOne', async () => {
    await repository.findOne({ id: '1' });
    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: undefined,
      order: undefined,
      select: undefined,
      take: undefined,
      skip: undefined,
      withDeleted: false,
    });
  });

  it('should call create and save', async () => {
    const result = await repository.create({ name: 'test' });
    expect(result.id).toBe('1');
    expect(repoMock.create).toHaveBeenCalledWith({ name: 'test' });
    expect(repoMock.save).toHaveBeenCalled();
  });

  it('should call update by using findOne and save', async () => {
    repoMock.findOne.mockResolvedValue({ id: '1', name: 'old' });
    await repository.update('1', { name: 'updated' });
    expect(repoMock.save).toHaveBeenCalledWith({ id: '1', name: 'updated' });
  });

  it('should call delete', async () => {
    await repository.delete('1');
    expect(repoMock.delete).toHaveBeenCalledWith('1');
  });

  it('should call count', async () => {
    const result = await repository.count({});
    expect(repoMock.count).toHaveBeenCalledWith({});
    expect(result).toBe(0);
  });

  it('should call softDelete', async () => {
    await repository.softDelete('1');
    expect(repoMock.softDelete).toHaveBeenCalledWith('1');
  });

  it('should call save', async () => {
    await repository.save({ id: '1' });
    expect(repoMock.save).toHaveBeenCalledWith({ id: '1' });
  });
});
